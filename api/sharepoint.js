import { getSharePointData } from './_sharepoint-service.js';

/**
 * Vercel Serverless Function (/api/sharepoint)
 * Serve o JSON processado da planilha SharePoint com cache Upstash Redis (@upstash/redis)
 */
export default async function handler(req, res) {
  const nocache = String(req.query?.nocache) === 'true';
  const requestAcceptEncoding = String(
    req.headers?.['accept-encoding'] ||
    req.headers?.['Accept-Encoding'] ||
    ''
  ).toLowerCase();

  try {
    const result = await getSharePointData({
      nocache,
      requestAcceptEncoding,
    });

    // Configurar cabeçalhos de resposta HTTP
    Object.entries(result.headers || {}).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(result.statusCode || 200).send(result.body);
  } catch (error) {
    console.error('[Vercel API /sharepoint] Erro não tratado:', error);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Erro interno na Vercel Function /api/sharepoint',
      details: error.message,
    });
  }
}
