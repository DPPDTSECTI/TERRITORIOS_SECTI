/**
 * Netlify Function: Proxy para download da planilha do SharePoint
 * Evita problemas de CORS e autentica o download
 */

exports.handler = async (event, context) => {
  const downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/valmir_ferreira_secti_ba_gov_br/IQDZbNB-DvGJTIGRveSkOzDZATYdKyDyClL0S6SsWABR4bw?download=1';

  console.log('[Netlify Function] Iniciando proxy do SharePoint...');

  try {
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
      },
      redirect: 'follow', // Seguir redirecionamentos automaticamente
      timeout: 30000,
    });

    console.log(`[Netlify Function] Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.error(`[Netlify Function] Erro HTTP: ${response.status}`);
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `HTTP ${response.status}` }),
      };
    }

    // Ler o buffer do arquivo
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);

    console.log(`[Netlify Function] Download concluído: ${data.length} bytes`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': data.length.toString(),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=3600', // Cache por 1 hora
      },
      body: data.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('[Netlify Function] Erro:', error.message);
    return {
      statusCode: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
