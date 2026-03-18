/**
 * Netlify Function: Proxy para download da planilha do SharePoint
 * Processa o Excel serverless e retorna JSON (evita limite de 6MB)
 * OTIMIZADO: Cache em memória + Compressão gzip + Netlify Blobs
 */
const { parseSpreadsheet } = require('./sharepoint-processor');
const zlib = require('zlib');
const { promisify } = require('util');

// @netlify/blobs é external (não bundlado pelo esbuild) → resolvido em runtime
// Carregamento lazy para isolar qualquer falha de import
let _getStore = null;
function getBlobStore(name) {
  if (!_getStore) {
    _getStore = require('@netlify/blobs').getStore;
  }
  return _getStore(name);
}

const BLOB_STORE_NAME = 'sharepoint-cache';
const BLOB_KEY = 'conecta-data';
const BLOB_MAX_AGE = 90 * 60 * 1000; // 90 minutos

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const inflate = promisify(zlib.inflate);
const brotliDecompress = promisify(zlib.brotliDecompress);

// Cache em memória (válido durante a execução da função serverless)
let cachedData = null;
let cacheExpiry = 0;
const CACHE_TTL = 0; // sem cache em memória para evitar dado antigo em produção

/**
 * Extrai URL de redirecionamento de uma página HTML
 */
function extractRedirectUrl(html) {
  // Log do HTML para debug
  console.log('[Netlify] HTML recebido (primeiros 1000 chars):', html.substring(0, 1000));
  
  const patterns = [
    // Meta refresh
    /<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^;"]*;\s*url=([^"']+)["']/i,
    // Javascript redirects
    /window\.location\s*=\s*["']([^"']+)["']/i,
    /window\.location\.href\s*=\s*["']([^"']+)["']/i,
    /location\.replace\s*\(\s*["']([^"']+)["']\s*\)/i,
    /document\.location\s*=\s*["']([^"']+)["']/i,
    /document\.location\.href\s*=\s*["']([^"']+)["']/i,
    // URLs diretas do SharePoint
    /(https:\/\/[^"'\s<>]+sharepoint[^"'\s<>]*download[^"'\s<>]*)/i,
    /(https:\/\/[^"'\s<>]+sharepoint\.com[^"'\s<>]+)/i,
    // Padrão específico da página de redirect da Microsoft
    /url=([^"'\s&<>]+)/i,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = match[1];
      console.log(`[Netlify] ✓ URL encontrada via regex ${i}: ${url.substring(0, 150)}`);
      
      // Decodificar URL se necessário
      try {
        const decoded = decodeURIComponent(url);
        console.log(`[Netlify] URL decodificada: ${decoded.substring(0, 150)}`);
        return decoded;
      } catch {
        return url;
      }
    }
  }
  
  console.log('[Netlify] ✗ Nenhum redirect encontrado no HTML');
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

    console.log(`[Netlify] Requisição: ${url.substring(0, 100)}...`);
    console.log(`[Netlify] Headers:`, Object.keys(headers).join(', '));

    https.default.get(url, { headers }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        console.log(`[Netlify] Resposta recebida: ${response.statusCode}, Content-Type: ${response.headers['content-type']}`);
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
    console.warn(`[Netlify] Falha ao descomprimir (${encoding}), usando dados brutos:`, decodeError.message);
    return data;
  }

  return data;
}

exports.handler = async (event, context) => {
  const downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/valmir_ferreira_secti_ba_gov_br/IQDZbNB-DvGJTIGRveSkOzDZATYdKyDyClL0S6SsWABR4bw?download=1';
  const nocache = event.queryStringParameters?.nocache === 'true';
  const requestAcceptEncoding = (
    event?.headers?.['accept-encoding'] ||
    event?.headers?.['Accept-Encoding'] ||
    ''
  ).toLowerCase();

  console.log('[Netlify] === PROXY SHAREPOINT (PARSE NO SERVIDOR + CACHE + GZIP) ===');
  
  // OTIMIZAÇÃO 1: Verificar cache em memória (bypassar se nocache=true)
  if (!nocache && cachedData && Date.now() < cacheExpiry) {
    const age = Math.round((Date.now() - (cacheExpiry - CACHE_TTL)) / 1000);
    console.log(`[Netlify] ✓ Cache HIT (idade: ${age}s)`);
    
    const acceptsGzip = requestAcceptEncoding.includes('gzip');
    
    if (acceptsGzip) {
      try {
        const compressed = await gzip(cachedData.jsonString);
        console.log(`[Netlify] ✓ Comprimido: ${cachedData.jsonString.length} → ${compressed.length} bytes (${Math.round(100 - (compressed.length / cachedData.jsonString.length * 100))}% menor)`);
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'ETag': cachedData.etag,
            'X-Content-Source': 'cache-compressed',
            'X-Cache-Age': age.toString(),
          },
          body: compressed.toString('base64'),
          isBase64Encoded: true,
        };
      } catch (compressError) {
        console.warn('[Netlify] Erro ao comprimir, enviando sem compressão:', compressError.message);
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'ETag': cachedData.etag,
        'X-Content-Source': 'cache',
        'X-Cache-Age': age.toString(),
      },
      body: cachedData.jsonString,
    };
  }
  
  if (nocache) {
    console.log('[Netlify] 🚫 BYPASS DE CACHE SOLICITADO (nocache=true)');
  } else {
    console.log('[Netlify] Cache MISS - buscando dados do SharePoint...');
  }

  // BLOB CACHE: Cache persistente entre invocações/cold starts → resposta instantânea
  if (!nocache) {
    try {
      const store = getBlobStore(BLOB_STORE_NAME);
      const blob = await store.get(BLOB_KEY, { type: 'json' });
      if (blob && blob.jsonString && blob.timestamp) {
        const ageMs = Date.now() - blob.timestamp;
        const ageSec = Math.round(ageMs / 1000);
        if (ageMs < BLOB_MAX_AGE) {
          console.log(`[Netlify] ✓ Blob HIT (${ageSec}s < 90min) → resposta instantânea`);
          const acceptsGzip = requestAcceptEncoding.includes('gzip');
          if (acceptsGzip) {
            try {
              const compressed = await gzip(blob.jsonString);
              return {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Encoding': 'gzip',
                  'Access-Control-Allow-Origin': '*',
                  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                  'X-Content-Source': 'blob-compressed',
                  'X-Cache-Age': String(ageSec),
                  'X-Geracao': String(blob.timestamp),
                },
                body: compressed.toString('base64'),
                isBase64Encoded: true,
              };
            } catch (_) { /* fallback sem compressão */ }
          }
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              'X-Content-Source': 'blob',
              'X-Cache-Age': String(ageSec),
              'X-Geracao': String(blob.timestamp),
            },
            body: blob.jsonString,
          };
        }
        console.log(`[Netlify] Blob stale (${ageSec}s ≥ 90min), buscando dados frescos...`);
      } else {
        console.log('[Netlify] Blob vazio/ausente, buscando do SharePoint...');
      }
    } catch (blobReadErr) {
      console.error('[Netlify] !!! BLOB READ ERRO:', blobReadErr.message);
      console.error('[Netlify] BLOB STACK:', blobReadErr.stack);
    }
  }

  try {
    let url = downloadUrl;
    let cookies = '';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[Netlify] Tentativa ${attempts}/${maxAttempts}`);

      const response = await httpsGet(url, cookies);
      const decodedData = await decodeResponseBody(response.data, response.headers['content-encoding']);
      const contentType = response.headers['content-type'] || '';

      console.log(`[Netlify] Status: ${response.status}, Size(raw/decoded): ${response.data.length}/${decodedData.length} bytes`);

      // Atualizar cookies
      if (response.headers['set-cookie']) {
        const setCookies = Array.isArray(response.headers['set-cookie']) 
          ? response.headers['set-cookie'] 
          : [response.headers['set-cookie']];
        cookies = setCookies.map(c => c.split(';')[0]).join('; ');
      }

      // Seguir redirecionamentos HTTP
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.location;
        if (location) {
          url = location.startsWith('http') ? location : `https://prodeboffice365-my.sharepoint.com${location}`;
          console.log(`[Netlify] → HTTP Redirect`);
          continue;
        }
      }

      // Status 200
      if (response.status === 200) {
        // Verificar se é Excel (começa com PK)
        if (decodedData.length >= 2 && decodedData[0] === 0x50 && decodedData[1] === 0x4B) {
          console.log(`[Netlify] ✓ Excel recebido: ${decodedData.length} bytes`);
          console.log(`[Netlify] Processando Excel...`);
          
          try {
            const startParse = Date.now();
            const jsonData = parseSpreadsheet(decodedData);
            const parseTime = Date.now() - startParse;
            
            const jsonString = JSON.stringify(jsonData);
            const jsonSize = Buffer.byteLength(jsonString);
            
            console.log(`[Netlify] ✓ JSON gerado em ${parseTime}ms: ${jsonSize} bytes (${Object.keys(jsonData).length} municípios)`);
            
            // Gerar ETag baseado no conteúdo
            const crypto = require('crypto');
            const etag = crypto.createHash('md5').update(jsonString).digest('hex');
            
            // OTIMIZAÇÃO 2: Salvar no cache em memória
            cachedData = { jsonString, etag };
            cacheExpiry = Date.now() + CACHE_TTL;
            console.log(`[Netlify] ✓ Dados salvos no cache (válido por ${CACHE_TTL / 60000} minutos)`);

            // BLOB: Persistência entre cold starts (elimina espera de 25s)
            try {
              const store = getBlobStore(BLOB_STORE_NAME);
              await store.setJSON(BLOB_KEY, { jsonString, etag, timestamp: Date.now() });
              console.log('[Netlify] ✓ Dados salvos no Netlify Blob (cache persistente)');
            } catch (blobSaveErr) {
              console.error('[Netlify] !!! BLOB SAVE ERRO:', blobSaveErr.message);
              console.error('[Netlify] BLOB SAVE STACK:', blobSaveErr.stack);
            }
            
            // OTIMIZAÇÃO 3: Comprimir resposta (se cliente aceitar)
            const acceptsGzip = requestAcceptEncoding.includes('gzip');
            
            if (acceptsGzip) {
              try {
                const startCompress = Date.now();
                const compressed = await gzip(jsonString);
                const compressTime = Date.now() - startCompress;
                const compressionRatio = Math.round(100 - (compressed.length / jsonSize * 100));
                
                console.log(`[Netlify] ✓ Comprimido em ${compressTime}ms: ${jsonSize} → ${compressed.length} bytes (${compressionRatio}% menor)`);
                
                return {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json',
                    'Content-Encoding': 'gzip',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                    'ETag': `"${etag}"`,
                    'X-Content-Source': 'sharepoint-processed-compressed',
                    'X-Parse-Time': parseTime.toString(),
                    'X-Compress-Time': compressTime.toString(),
                  },
                  body: compressed.toString('base64'),
                  isBase64Encoded: true,
                };
              } catch (compressError) {
                console.warn('[Netlify] Erro ao comprimir, enviando sem compressão:', compressError.message);
              }
            }
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'ETag': `"${etag}"`,
                'X-Content-Source': 'sharepoint-processed',
                'X-Parse-Time': parseTime.toString(),
              },
              body: jsonString,
            };
          } catch (parseError) {
            console.error('[Netlify] Erro ao parsear Excel:', parseError.message);
            return {
              statusCode: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                error: 'Erro ao processar Excel',
                details: parseError.message,
              }),
            };
          }
        }
        
        // HTML - tentar extrair redirect
        if (contentType.includes('text/html')) {
          const html = decodedData.toString();
          const redirectUrl = extractRedirectUrl(html);
          
          if (redirectUrl) {
            url = redirectUrl.startsWith('http') ? redirectUrl : `https://prodeboffice365-my.sharepoint.com${redirectUrl}`;
            console.log(`[Netlify] → HTML Redirect extraído: ${url.substring(0, 150)}`);
            continue;
          } else {
            console.error('[Netlify] HTML recebido sem redirect válido');
            console.error('[Netlify] HTML snippet:', html.substring(0, 500));
            
            return {
              statusCode: 502,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                error: 'SharePoint retornou HTML sem redirect válido',
                preview: html.substring(0, 300),
                attempt: attempts,
                contentType: contentType,
              }),
            };
          }
        }
        
        // Outro conteúdo
        console.warn(`[Netlify] Content-Type inesperado: ${contentType}`);
        return {
          statusCode: 502,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Content-Type inválido',
            contentType: contentType,
            dataSize: decodedData.length,
          }),
        };
      }

      // Outros status
      console.warn(`[Netlify] Status HTTP inesperado: ${response.status}`);
      return {
        statusCode: 502,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: `SharePoint retornou HTTP ${response.status}`,
          status: response.status,
        }),
      };
    }

    // Max redirects atingido
    console.error(`[Netlify] Máximo de redirects (${maxAttempts}) atingido`);
    return {
      statusCode: 502,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Máximo de redirects atingido',
        attempts: maxAttempts,
      }),
    };
  } catch (error) {
    console.error('[Netlify] !!! ERRO GERAL !!!');
    console.error('[Netlify] Erro:', error.message);
    console.error('[Netlify] Stack:', error.stack);
    
    return {
      statusCode: 502,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Erro ao conectar com SharePoint',
        details: error.message,
      }),
    };
  }
};
