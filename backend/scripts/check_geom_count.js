import { Client } from 'pg';
import dotenv from 'dotenv';

// Load .env from current working directory (backend) when script is executed there
dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Please set DATABASE_URL');
  process.exit(1);
}

const pg = new Client({ connectionString: databaseUrl });

async function main() {
  await pg.connect();
  const res = await pg.query('SELECT count(*) AS cnt, count(geom) FILTER (WHERE geom IS NOT NULL) AS geom_cnt FROM "road"');
  console.log(res.rows[0]);
  await pg.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
