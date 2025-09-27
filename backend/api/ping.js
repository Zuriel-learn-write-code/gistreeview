export default function (req, res) {
  // Allow CORS from the frontend (adjust if you have multiple origins)
  res.setHeader('Access-Control-Allow-Origin', 'https://gistreeview.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json({ ok: true, now: new Date().toISOString(), source: 'ping-function' });
}
