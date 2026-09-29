import { captureReportWithPlaywright } from '../scripts/captureReports.mjs';

/**
 * Endpoint Serverless da Vercel para exportação de relatórios em PNG 16:9 via Chromium
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type = 'sintese', territorio = 'bahia', modo = 'normal', theme = 'light' } = req.query || {};

    let route = '/relatorio/sintese';

    if (type === 'ativos') {
      route = '/relatorio/ativos';
    } else if (type === 'cursos') {
      route = '/relatorio/cursos';
    } else if (type === 'cadeias') {
      route = '/relatorio/cadeias';
    }

    const terrParam = territorio && territorio !== 'bahia'
      ? `territorio=${encodeURIComponent(territorio)}`
      : 'territorio=bahia';

    const fullRoute = `${route}?${terrParam}&modo=${modo === 'semiarido' ? 'semiarido' : 'normal'}&theme=${theme === 'dark' ? 'dark' : 'light'}`;
    const finalPngName = `relatorio_${type}_${modo}_${theme}.png`;

    // Determina a URL base pública onde a aplicação está rodando na Vercel
    let host = req.headers['x-forwarded-host'] || req.headers.host || process.env.VERCEL_URL || 'localhost:5173';
    if (host.startsWith('127.0.0.1:')) {
      host = host.replace('127.0.0.1:', 'localhost:');
    }
    const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;

    const result = await captureReportWithPlaywright({
      route: fullRoute,
      baseUrl,
      theme
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', result.pngBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${finalPngName}"`);
    return res.end(result.pngBuffer);
  } catch (err) {
    console.error('[Vercel Serverless export-png] Erro:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Erro ao exportar PNG no servidor' });
  }
}
