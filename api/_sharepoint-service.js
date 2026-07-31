import { parseSpreadsheet } from './_sharepoint-processor.js';
import zlib from 'zlib';
import { promisify } from 'util';
import crypto from 'crypto';
import { createClient } from '@vercel/kv';

const KV_KEY = 'conecta-data';
const KV_MAX_AGE_MS = 90 * 60 * 1000; // 90 minutos em ms
const KV_TTL_SEC = 90 * 60; // 90 minutos em segundos (5400s)

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const inflate = promisify(zlib.inflate);
const brotliDecompress = promisify(zlib.brotliDecompress);

// Cache em memória (válido durante a existência da instância serverless)
let cachedData = null;
let cacheExpiry = 0;
const CACHE_TTL = 0; // 0 para evitar dado antigo em memória entre requisições na produção

/**
 * Cria ou retorna cliente do Vercel KV de forma segura (sem quebrar caso env vars não estejam setadas)
 */
let _kvClient = undefined;
function getKVClient() {
  if (_kvClient !== undefined) return _kvClient;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[Vercel KV] Variáveis KV_REST_API_URL / KV_REST_API_TOKEN não definidas no ambiente.');
    _kvClient = null;
    return null;
  }

  try {
    _kvClient = createClient({ url, token });
    return _kvClient;
  } catch (err) {
    console.warn('[Vercel KV] Falha ao criar cliente Vercel KV:', err.message);
    _kvClient = null;
    return null;
  }
}

/**
 * Extrai URL de redirecionamento de uma página HTML
 */
function extractRedirectUrl(html) {
  console.log('[Vercel] HTML recebido (primeiros 1000 chars):', html.substring(0, 1000));
  
  const patterns = [
    /<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^;"]*;\s*url=([^"']+)["']/i,
    /window\.location\s*=\s*["']([^"']+)["']/i,
    /window\.location\.href\s*=\s*["']([^"']+)["']/i,
    /location\.replace\s*\(\s*["']([^"']+)["']\s*\)/i,
    /document\.location\s*=\s*["']([^"']+)["']/i,
    /document\.location\.href\s*=\s*["']([^"']+)["']/i,
    /(https:\/\/[^"'\s<>]+sharepoint[^"'\s<>]*download[^"'\s<>]*)/i,
    /(https:\/\/[^"'\s<>]+sharepoint\.com[^"'\s<>]+)/i,
    /url=([^"'\s&<>]+)/i,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = match[1];
      console.log(`[Vercel] ✓ URL encontrada via regex ${i}: ${url.substring(0, 150)}`);
      
      try {
        const decoded = decodeURIComponent(url);
        console.log(`[Vercel] URL decodificada: ${decoded.substring(0, 150)}`);
        return decoded;
      } catch {
        return url;
      }
    }
  }
  
  console.log('[Vercel] ✗ Nenhum redirect encontrado no HTML');
  return null;
}

/**
 * Faz requisição HTTPS e retorna dados + headers
 */
async function httpsGet(url, cookies = '') {
  const https = await import('https');
  
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    if (cookies) {
      headers['Cookie'] = cookies;
    }

    console.log(`[Vercel] Requisição: ${url.substring(0, 100)}...`);
    console.log(`[Vercel] Headers:`, Object.keys(headers).join(', '));

    https.default.get(url, { headers }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        console.log(`[Vercel] Resposta recebida: ${response.statusCode}, Content-Type: ${response.headers['content-type']}`);
        resolve({
          status: response.statusCode,
          headers: response.headers,
          data: Buffer.concat(chunks),
        });
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Decodifica corpo de resposta comprimido (gzip/deflate/br)
 */
async function decodeResponseBody(data, contentEncoding = '') {
  if (!data || !contentEncoding) {
    return data;
  }

  const encoding = String(contentEncoding).toLowerCase();

  try {
    if (encoding.includes('br')) {
      return await brotliDecompress(data);
    }
    if (encoding.includes('gzip')) {
      return await gunzip(data);
    }
    if (encoding.includes('deflate')) {
      return await inflate(data);
    }
  } catch (decodeError) {
    console.warn(`[Vercel] Falha ao descomprimir (${encoding}), usando dados brutos:`, decodeError.message);
    return data;
  }

  return data;
}

/**
 * Função principal de obtenção e processamento de dados do SharePoint com cache Vercel KV
 */
export async function getSharePointData({ nocache = false, requestAcceptEncoding = '' }) {
  const downloadUrl = process.env.VITE_SHAREPOINT_URL || process.env.SHAREPOINT_URL || 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1';
  const acceptsGzip = requestAcceptEncoding.includes('gzip');

  console.log('[Vercel] === PROXY SHAREPOINT (PARSE NO SERVIDOR + VERCEL KV CACHE + GZIP) ===');

  // OTIMIZAÇÃO 1: Verificar cache em memória (bypassar se nocache=true)
  if (!nocache && cachedData && Date.now() < cacheExpiry) {
    const age = Math.round((Date.now() - (cacheExpiry - CACHE_TTL)) / 1000);
    console.log(`[Vercel] ✓ Cache HIT em memória (idade: ${age}s)`);

    if (acceptsGzip) {
      try {
        const compressed = await gzip(cachedData.jsonString);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Encoding': 'gzip',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'ETag': cachedData.etag,
            'X-Content-Source': 'cache-compressed',
            'X-Cache-Age': age.toString(),
          },
          body: compressed,
          source: 'cache-compressed',
        };
      } catch (compressError) {
        console.warn('[Vercel] Erro ao comprimir cache memória, enviando sem compressão:', compressError.message);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'ETag': cachedData.etag,
        'X-Content-Source': 'cache',
        'X-Cache-Age': age.toString(),
      },
      body: cachedData.jsonString,
      source: 'cache',
    };
  }

  if (nocache) {
    console.log('[Vercel] 🚫 BYPASS DE CACHE SOLICITADO (nocache=true)');
  } else {
    console.log('[Vercel] Cache memória MISS - verificando Vercel KV...');
  }

  // OTIMIZAÇÃO 2: Verificar Vercel KV (@vercel/kv) - chave 'conecta-data', TTL 90 min
  if (!nocache) {
    const kv = getKVClient();
    if (kv) {
      try {
        const stored = await kv.get(KV_KEY);
        if (stored && stored.jsonString && stored.timestamp) {
          const ageMs = Date.now() - stored.timestamp;
          const ageSec = Math.round(ageMs / 1000);
          if (ageMs < KV_MAX_AGE_MS) {
            console.log(`[Vercel KV] ✓ Cache HIT (${ageSec}s < 90min) → resposta instantânea`);
            
            if (acceptsGzip) {
              try {
                const compressed = await gzip(stored.jsonString);
                return {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Encoding': 'gzip',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                    'ETag': `"${stored.etag}"`,
                    'X-Content-Source': 'vercel-kv-compressed',
                    'X-Cache-Age': String(ageSec),
                    'X-Geracao': String(stored.timestamp),
                  },
                  body: compressed,
                  source: 'vercel-kv-compressed',
                };
              } catch (_) {
                /* fallback sem compressão */
              }
            }

            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'ETag': `"${stored.etag}"`,
                'X-Content-Source': 'vercel-kv',
                'X-Cache-Age': String(ageSec),
                'X-Geracao': String(stored.timestamp),
              },
              body: stored.jsonString,
              source: 'vercel-kv',
            };
          }
          console.log(`[Vercel KV] Cache stale (${ageSec}s ≥ 90min), buscando dados frescos...`);
        } else {
          console.log('[Vercel KV] Chave vazia ou ausente, buscando do SharePoint...');
        }
      } catch (kvReadErr) {
        console.error('[Vercel KV] Erro ao ler chave:', kvReadErr.message);
      }
    }
  }

  // Obter do SharePoint e processar Excel
  try {
    let url = downloadUrl;
    let cookies = '';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[Vercel] Tentativa ${attempts}/${maxAttempts}`);

      const response = await httpsGet(url, cookies);
      const decodedData = await decodeResponseBody(response.data, response.headers['content-encoding']);
      const contentType = response.headers['content-type'] || '';

      console.log(`[Vercel] Status: ${response.status}, Size(raw/decoded): ${response.data.length}/${decodedData.length} bytes`);

      if (response.headers['set-cookie']) {
        const setCookies = Array.isArray(response.headers['set-cookie'])
          ? response.headers['set-cookie']
          : [response.headers['set-cookie']];
        cookies = setCookies.map((c) => c.split(';')[0]).join('; ');
      }

      // Redirecionamento HTTP
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.location;
        if (location) {
          url = location.startsWith('http') ? location : `https://prodeboffice365-my.sharepoint.com${location}`;
          console.log(`[Vercel] → HTTP Redirect`);
          continue;
        }
      }

      // Status 200
      if (response.status === 200) {
        // Verificar assinatura Excel (PK)
        if (decodedData.length >= 2 && decodedData[0] === 0x50 && decodedData[1] === 0x4B) {
          console.log(`[Vercel] ✓ Excel recebido: ${decodedData.length} bytes. Processando...`);

          try {
            const startParse = Date.now();
            const jsonData = parseSpreadsheet(decodedData);
            const parseTime = Date.now() - startParse;

            const jsonString = JSON.stringify(jsonData);
            const jsonSize = Buffer.byteLength(jsonString);

            console.log(`[Vercel] ✓ JSON gerado em ${parseTime}ms: ${jsonSize} bytes (${Object.keys(jsonData).length} municípios)`);

            const etag = crypto.createHash('md5').update(jsonString).digest('hex');

            // Cache em memória
            cachedData = { jsonString, etag };
            cacheExpiry = Date.now() + CACHE_TTL;

            // Gravar no Vercel KV (@vercel/kv) com TTL de 90min (5400 segundos)
            const kv = getKVClient();
            if (kv) {
              try {
                await kv.set(
                  KV_KEY,
                  { jsonString, etag, timestamp: Date.now() },
                  { ex: KV_TTL_SEC }
                );
                console.log('[Vercel KV] ✓ Dados gravados no KV (chave conecta-data, TTL: 5400s)');
              } catch (kvWriteErr) {
                console.error('[Vercel KV] Erro ao gravar chave no KV:', kvWriteErr.message);
              }
            }

            // Comprimir se o cliente suportar
            if (acceptsGzip) {
              try {
                const startCompress = Date.now();
                const compressed = await gzip(jsonString);
                const compressTime = Date.now() - startCompress;
                const compressionRatio = Math.round(100 - (compressed.length / jsonSize * 100));

                console.log(`[Vercel] ✓ Comprimido em ${compressTime}ms: ${jsonSize} → ${compressed.length} bytes (${compressionRatio}% menor)`);

                return {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Encoding': 'gzip',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                    'ETag': `"${etag}"`,
                    'X-Content-Source': 'sharepoint-processed-compressed',
                    'X-Parse-Time': parseTime.toString(),
                    'X-Compress-Time': compressTime.toString(),
                  },
                  body: compressed,
                  source: 'sharepoint-processed-compressed',
                };
              } catch (compressError) {
                console.warn('[Vercel] Erro ao comprimir, enviando sem compressão:', compressError.message);
              }
            }

            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'ETag': `"${etag}"`,
                'X-Content-Source': 'sharepoint-processed',
                'X-Parse-Time': parseTime.toString(),
              },
              body: jsonString,
              source: 'sharepoint-processed',
            };
          } catch (parseError) {
            console.error('[Vercel] Erro ao parsear Excel:', parseError.message);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                error: 'Erro ao processar Excel',
                details: parseError.message,
              }),
              source: 'error',
            };
          }
        }

        // HTML - tentar extrair redirect
        if (contentType.includes('text/html')) {
          const html = decodedData.toString();
          const redirectUrl = extractRedirectUrl(html);

          if (redirectUrl) {
            url = redirectUrl.startsWith('http') ? redirectUrl : `https://prodeboffice365-my.sharepoint.com${redirectUrl}`;
            console.log(`[Vercel] → HTML Redirect extraído: ${url.substring(0, 150)}`);
            continue;
          } else {
            console.error('[Vercel] HTML recebido sem redirect válido');
            return {
              statusCode: 502,
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                error: 'SharePoint retornou HTML sem redirect válido',
                preview: html.substring(0, 300),
                attempt: attempts,
                contentType: contentType,
              }),
              source: 'error',
            };
          }
        }

        console.warn(`[Vercel] Content-Type inesperado: ${contentType}`);
        return {
          statusCode: 502,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Content-Type inválido',
            contentType: contentType,
            dataSize: decodedData.length,
          }),
          source: 'error',
        };
      }

      console.warn(`[Vercel] Status HTTP inesperado: ${response.status}`);
      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: `SharePoint retornou HTTP ${response.status}`,
          status: response.status,
        }),
        source: 'error',
      };
    }

    console.error(`[Vercel] Máximo de redirects (${maxAttempts}) atingido`);
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Máximo de redirects atingido',
        attempts: maxAttempts,
      }),
      source: 'error',
    };
  } catch (error) {
    console.error('[Vercel] Erro ao conectar com SharePoint:', error.message);
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Erro ao conectar com SharePoint',
        details: error.message,
      }),
      source: 'error',
    };
  }
}
