/**
 * Netlify Scheduled Function: Pré-aquece o cache do SharePoint a cada 30 minutos.
 *
 * Por que existe:
 *   A função principal (sharepoint.js) serve dados do Netlify Blob em < 100ms.
 *   Este agendador garante que o Blob nunca fique com mais de 30 min de idade,
 *   eliminando completamente a espera de 25s para todos os usuários.
 *
 * Schedule: a cada 30 minutos (configurado em netlify.toml)
 */
const { handler: sharepointHandler } = require('./sharepoint');

exports.handler = async (event, context) => {
  console.log('[Refresh] 🔄 Iniciando atualização agendada do cache SharePoint...');

  try {
    const result = await sharepointHandler(
      { queryStringParameters: { nocache: 'true' }, headers: {} },
      context
    );

    const source = result?.headers?.['X-Content-Source'] || 'desconhecido';
    console.log(`[Refresh] ✅ Cache atualizado com sucesso (source: ${source})`);
  } catch (err) {
    console.error('[Refresh] ❌ Erro na atualização agendada:', err.message);
    // Não relançar — falha silenciosa para não travar o agendador
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
