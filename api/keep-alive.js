// Chamado diariamente pelo Vercel Cron (ver vercel.json) para evitar que o
// projeto Supabase do plano gratuito seja pausado por inatividade.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return res.status(500).json({ ok: false, error: 'missing supabase env vars' });
  }

  try {
    const response = await fetch(`${url}/rest/v1/tipo_ativos?select=*&limit=1`, {
      headers: { apikey: key },
    });
    return res.status(response.ok ? 200 : 502).json({
      ok: response.ok,
      status: response.status,
      at: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message });
  }
}
