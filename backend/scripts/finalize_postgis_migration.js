import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

// This script will:
// 1. Export the existing `geometry` JSON column from `road` to a backup file.
// 2. Drop the `geometry` column from `road`.
// Use with caution in production. Use --dry-run to only view actions.

dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Please set DATABASE_URL in environment or .env');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const backupDir = path.join(process.cwd(), 'backups');

async function main() {
  const pg = new Client({ connectionString: databaseUrl });
  await pg.connect();

  try {
    // 1) Check if geometry column exists
    const colRes = await pg.query(`SELECT column_name FROM information_schema.columns WHERE table_name='road' AND column_name='geometry'`);
    const hasGeometry = colRes.rowCount > 0;
    if (!hasGeometry) {
      console.log('No `geometry` column found on table `road`. Nothing to do.');
      return;
    }

    // 2) Backup: export id and geometry
    console.log('Exporting existing geometry values to backup file...');
    const res = await pg.query(`SELECT id, geometry FROM "road"`);
    const rows = res.rows;

    if (rows.length === 0) {
      console.log('No rows to backup.');
    } else {
      if (dryRun) {
        console.log(`[dry-run] Would write ${rows.length} rows to backup file`);
      } else {
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `road_geometry_backup_${ts}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(rows, null, 2), 'utf8');
        console.log(`Backup written to ${backupPath}`);
      }
    }

    // 3) Drop column
    if (dryRun) {
      console.log('[dry-run] Would execute: ALTER TABLE "road" DROP COLUMN IF EXISTS geometry;');
    } else {
      console.log('Dropping column `geometry` from `road`...');
      await pg.query(`ALTER TABLE "road" DROP COLUMN IF EXISTS geometry`);
      console.log('Column dropped.');
    }

    console.log('Finalize migration complete.');
  } finally {
    await pg.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
