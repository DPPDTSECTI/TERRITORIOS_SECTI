/**
 * Netlify Function: Proxy para download da planilha do SharePoint
 * Replica a lógica do vite.config.js para preservar cookies e seguir redirecionamentos
 */
const https = require('https');

/**
 * Faz requisição HTTPS e retorna dados + headers
 */
function httpsGet(url, cookies = '') {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
    };

    if (cookies) {
      headers['Cookie'] = cookies;
    }

    console.log(`[Netlify] GET ${url}`);
    console.log(`[Netlify] Headers:`, Object.keys(headers));

    https.get(url, { headers }, (response) => {
      let data = Buffer.alloc(0);
      
      response.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });

      response.on('end', () => {
        resolve({
          status: response.statusCode,
          headers: response.headers,
          data: data,
        });
      });
    }).on('error', reject);
  });
}

exports.handler = async (event, context) => {
  const downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/valmir_ferreira_secti_ba_gov_br/IQDZbNB-DvGJTIGRveSkOzDZATYdKyDyClL0S6SsWABR4bw?download=1';

  console.log('[Netlify] Iniciando proxy do SharePoint...');

  try {
    let url = downloadUrl;
    let cookies = '';
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[Netlify] Tentativa ${attempts}/${maxAttempts}: ${url}`);

      const response = await httpsGet(url, cookies);
      const contentType = response.headers['content-type'] || '';

      console.log(`[Netlify] Status: ${response.status}, Content-Type: ${contentType.substring(0, 50)}`);

      // Atualizar cookies
      if (response.headers['set-cookie']) {
        const setCookies = Array.isArray(response.headers['set-cookie']) 
          ? response.headers['set-cookie'] 
          : [response.headers['set-cookie']];
        cookies = setCookies.map(c => c.split(';')[0]).join('; ');
        console.log(`[Netlify] Cookies atualizados`);
      }

      // Seguir redirecionamentos
      if (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307) {
        const location = response.headers.location;
        if (location) {
          url = location.startsWith('http') ? location : `https://prodeboffice365-my.sharepoint.com${location}`;
          console.log(`[Netlify] Redirecionando para: ${url.substring(0, 80)}...`);
          continue;
        }
      }

      // Arquivo encontrado
      if (response.status === 200 && (
        contentType.includes('spreadsheet') || 
        contentType.includes('excel') || 
        contentType.includes('octet-stream')
      )) {
        console.log(`[Netlify] ✓ Arquivo recebido: ${response.data.length} bytes`);
        
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
      }

      // Erro ou conteúdo inesperado
      if (response.status === 200) {
        // Provavelmente HTML de erro
        const preview = response.data.toString().substring(0, 500);
        console.error(`[Netlify] Conteúdo inesperado (${contentType}):`, preview);
        
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Conteúdo inválido (não é arquivo Excel)',
            contentType: contentType,
            statusCode: response.status,
            preview: preview,
          }),
        };
      }

      // Outros status
      console.error(`[Netlify] Status ${response.status} inesperado`);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `Status HTTP ${response.status}`,
          url: url,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Máximo de redirecionamentos atingido',
      }),
    };
  } catch (error) {
    console.error('[Netlify] Erro:', error.message);
    console.error('[Netlify] Stack:', error.stack);
    
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        type: error.constructor.name,
      }),
    };
  }
};
