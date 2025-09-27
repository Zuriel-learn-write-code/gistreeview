console.log('ping function module loaded at', new Date().toISOString());

export default function (req, res) {
  try {
    console.log('ping handler invoked at', new Date().toISOString(), 'method', req.method);
    // Allow CORS from the frontend (adjust if you have multiple origins)
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',')[0] : 'https://gistreeview.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    return res.status(200).json({ ok: true, now: new Date().toISOString(), source: 'ping-function' });
  } catch (err) {
    console.error('ping handler error', err);
    try { res.status(500).json({ error: 'ping error' }); } catch (e) { /* ignore */ }
  }
}
