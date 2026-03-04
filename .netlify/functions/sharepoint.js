/**
 * Netlify Function: Proxy para download da planilha do SharePoint
 * Retorna JSON com o arquivo em base64 para o cliente decodificar
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
      redirect: 'follow',
      timeout: 30000,
    });

    console.log(`[Netlify Function] Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.error(`[Netlify Function] Erro HTTP: ${response.status}`);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `HTTP ${response.status}` }),
      };
    }

    // Ler o buffer do arquivo
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);

    console.log(`[Netlify Function] Download concluído: ${data.length} bytes`);

    // Retornar como JSON com base64
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=3600',
      },
      body: JSON.stringify({
        success: true,
        data: data.toString('base64'),
        size: data.length,
      }),
    };
  } catch (error) {
    console.error('[Netlify Function] Erro:', error.message);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
