#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

const defaultOrigins = [
  'http://localhost:4000',
  'http://localhost:5173',
  'https://gistreeview.vercel.app'
];

let allowedOrigins = defaultOrigins;
if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
}
allowedOrigins = allowedOrigins.map(o => o.toLowerCase());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const incoming = origin.toLowerCase();
    if (allowedOrigins.includes(incoming)) return callback(null, true);
    return callback(new Error(`CORS policy: origin '${origin}' not allowed`), false);
  }
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.setHeader('x-dev-server', 'true');
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get('/', (req, res) => res.json({ message: 'local backend running' }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Dev backend listening on http://localhost:${port}`));
