/**
 * Netlify Function: Proxy para download da planilha do SharePoint
 * Replica a lógica do vite.config.js para preservar cookies e seguir redirecionamentos
 */

/**
 * Faz requisição HTTPS e retorna dados + headers
 */
async function httpsGet(url, cookies = '') {
  const https = await import('https');
  
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
    };

    if (cookies) {
      headers['Cookie'] = cookies;
    }

    console.log(`[Netlify] GET ${url.substring(0, 100)}...`);

    https.default.get(url, { headers }, (response) => {
      const chunks = [];
      
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });

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

  console.log('[Netlify] === INICIANDO PROXY SHAREPOINT ===');
  console.log('[Netlify] URL:', downloadUrl);

  try {
    let url = downloadUrl;
    let cookies = '';
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[Netlify] Tentativa ${attempts}/${maxAttempts}`);

      const response = await httpsGet(url, cookies);
      const contentType = response.headers['content-type'] || '';

      console.log(`[Netlify] Status: ${response.status}`);
      console.log(`[Netlify] Content-Type: ${contentType.substring(0, 50)}`);
      console.log(`[Netlify] Data size: ${response.data.length} bytes`);

      // Atualizar cookies
      if (response.headers['set-cookie']) {
        const setCookies = Array.isArray(response.headers['set-cookie']) 
          ? response.headers['set-cookie'] 
          : [response.headers['set-cookie']];
        cookies = setCookies.map(c => c.split(';')[0]).join('; ');
        console.log(`[Netlify] Cookies recebidos e atualizados`);
      }

      // Seguir redirecionamentos
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.location;
        if (location) {
          url = location.startsWith('http') ? location : `https://prodeboffice365-my.sharepoint.com${location}`;
          console.log(`[Netlify] → Redirecionando para: ${url.substring(0, 80)}...`);
          continue;
        } else {
          console.error('[Netlify] Redirect sem Location header');
          break;
        }
      }

      // Arquivo encontrado
      if (response.status === 200) {
        const isExcel = contentType.includes('spreadsheet') || 
                       contentType.includes('excel') || 
                       contentType.includes('octet-stream');
        
        if (isExcel) {
          console.log(`[Netlify] ✓ Arquivo Excel recebido: ${response.data.length} bytes`);
          
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'max-age=3600',
            },
            body: response.data.toString('base64'),
            isBase64Encoded: true,
          };
        } else {
          // HTML ou outro conteúdo
          const preview = response.data.toString().substring(0, 300);
          console.error(`[Netlify] ✗ Content-Type inválido: ${contentType}`);
          console.error(`[Netlify] Preview:`, preview);
          
          return {
            statusCode: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              error: 'Content-Type inválido (não é Excel)',
              contentType: contentType,
              preview: preview,
              attempts: attempts,
            }),
          };
        }
      }

      // Outros status
      console.error(`[Netlify] Status inesperado: ${response.status}`);
      return {
        statusCode: response.status || 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: `HTTP ${response.status}`,
          url: url.substring(0, 100),
        }),
      };
    }

    // Max redirects
    console.error('[Netlify] Máximo de redirecionamentos atingido');
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Máximo de redirecionamentos atingido',
        attempts: maxAttempts,
      }),
    };
  } catch (error) {
    console.error('[Netlify] ✗ ERRO:', error.message);
    console.error('[Netlify] Stack:', error.stack);
    
    return {
      statusCode: 502,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message,
        type: error.constructor.name,
        stack: error.stack,
      }),
    };
  }
};
