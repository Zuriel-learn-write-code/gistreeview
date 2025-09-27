console.log('logtest module loaded at', new Date().toISOString());

export default async function (req, res) {
  console.log('logtest handler invoked at', new Date().toISOString(), 'method', req.method);
  try {
    // quick response
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',')[0] : '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    console.log('logtest responding 200');
    return res.status(200).json({ ok: true, now: new Date().toISOString(), msg: 'logtest' });
  } catch (err) {
    console.error('logtest error', err);
    try { res.status(500).json({ error: 'internal' }); } catch (e) { /* ignore */ }
  }
}
