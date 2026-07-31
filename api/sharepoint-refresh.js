import { getSharePointData } from './_sharepoint-service.js';

// Vercel Cron Function (/api/sharepoint-refresh)
// Pré-aquece o cache do SharePoint a cada 30 minutos, executando download,
// parse da planilha e gravando no Upstash Redis (@upstash/redis) para que
// os usuários nunca precisem esperar o processamento do Excel (~25s).
// 
// Configurado no vercel.json via:
// "crons": [{ "path": "/api/sharepoint-refresh", "schedule": "0,30 * * * *" }]
export default async function handler(req, res) {
  console.log('[Vercel Refresh] 🔄 Iniciando atualização agendada do cache SharePoint no Vercel KV...');

  try {
    const result = await getSharePointData({
      nocache: true,
      requestAcceptEncoding: '',
    });

    const source = result.headers?.['X-Content-Source'] || result.source || 'desconhecido';
    console.log(`[Vercel Refresh] ✅ Cache atualizado com sucesso (source: ${source})`);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return res.status(200).json({
      ok: true,
      source,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('[Vercel Refresh] ❌ Erro na atualização agendada:', err.message);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
