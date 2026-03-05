/**
 * Netlify Function: Proxy para download da planilha do SharePoint
 * Processa o Excel serverless e retorna JSON (evita limite de 6MB)
 */
const { parseSpreadsheet } = require('./sharepoint-processor');

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

exports.handler = async (event, context) => {
  const downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/valmir_ferreira_secti_ba_gov_br/IQDZbNB-DvGJTIGRveSkOzDZATYdKyDyClL0S6SsWABR4bw?download=1';

  console.log('[Netlify] === PROXY SHAREPOINT (PARSE NO SERVIDOR) ===');

  try {
    let url = downloadUrl;
    let cookies = '';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[Netlify] Tentativa ${attempts}/${maxAttempts}`);

      const response = await httpsGet(url, cookies);
      const contentType = response.headers['content-type'] || '';

      console.log(`[Netlify] Status: ${response.status}, Size: ${response.data.length} bytes`);

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
        if (response.data.length >= 2 && response.data[0] === 0x50 && response.data[1] === 0x4B) {
          console.log(`[Netlify] ✓ Excel recebido: ${response.data.length} bytes`);
          console.log(`[Netlify] Processando Excel...`);
          
          try {
            const jsonData = parseSpreadsheet(response.data);
            const jsonString = JSON.stringify(jsonData);
            const jsonSize = Buffer.byteLength(jsonString);
            
            console.log(`[Netlify] ✓ JSON gerado: ${jsonSize} bytes (${Object.keys(jsonData).length} municípios)`);
            
            // Gerar ETag baseado no conteúdo
            const crypto = require('crypto');
            const etag = crypto.createHash('md5').update(jsonString).digest('hex');
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
                'ETag': `"${etag}"`,
                'X-Content-Source': 'sharepoint-processed',
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
          const html = response.data.toString();
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
            dataSize: response.data.length,
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
