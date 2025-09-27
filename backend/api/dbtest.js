console.log('dbtest module loaded at', new Date().toISOString());

import prisma from '../src/prismaClient.js';

export default async function handler(req, res) {
  const start = Date.now();
  console.log('dbtest handler invoked at', new Date().toISOString());
  try {
    // Minimal raw query to test connectivity
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    const duration = Date.now() - start;
    console.log('dbtest success, durationMs=', duration, 'result=', result);
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',')[0] : 'https://gistreeview.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    return res.status(200).json({ ok: true, durationMs: duration, result });
  } catch (err) {
    const duration = Date.now() - start;
    console.error('dbtest failed, durationMs=', duration, err);
    try { res.status(500).json({ error: 'dbtest failed', durationMs: duration }); } catch (e) { /* ignore */ }
  }
}
