/**
 * Netlify Function: Proxy para download da planilha do SharePoint
 * Processa o Excel serverless e retorna JSON (evita limite de 6MB)
 */
const { parseSpreadsheet } = require('./sharepoint-processor');

/**
 * Extrai URL de redirecionamento de uma página HTML
 */
function extractRedirectUrl(html) {
  const patterns = [
    /<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^;"]*;\s*url=([^"']+)["']/i,
    /window\.location\s*=\s*["']([^"']+)["']/i,
    /window\.location\.href\s*=\s*["']([^"']+)["']/i,
    /location\.replace\s*\(\s*["']([^"']+)["']\s*\)/i,
    /(https:\/\/[^"'\s<>]+sharepoint[^"'\s<>]*download[^"'\s<>]*)/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      console.log('[Netlify] URL encontrada via regex');
      return match[1];
    }
  }
  
  return null;
}

/**
 * Faz requisição HTTPS e retorna dados + headers
 */
async function httpsGet(url, cookies = '') {
  const https = await import('https');
  
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
    };

    if (cookies) {
      headers['Cookie'] = cookies;
    }

    https.default.get(url, { headers }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
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
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'max-age=3600',
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
            console.log(`[Netlify] → HTML Redirect extraído`);
            continue;
          } else {
            return {
              statusCode: 400,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                error: 'HTML sem redirect',
                preview: html.substring(0, 200),
              }),
            };
          }
        }
        
        // Outro conteúdo
        return {
          statusCode: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Content-Type inválido',
            contentType: contentType,
          }),
        };
      }

      // Outros status
      return {
        statusCode: response.status || 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: `HTTP ${response.status}`,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Max redirects',
      }),
    };
  } catch (error) {
    console.error('[Netlify] Erro:', error.message);
    
    return {
      statusCode: 502,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};
