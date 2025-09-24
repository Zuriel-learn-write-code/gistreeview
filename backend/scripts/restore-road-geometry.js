// restore-road-geometry.js
// Reads a backup JSON array [{id, geometry}, ...] and updates the `road.geom`
// PostGIS column for rows matching `id` (UUID). By default the script is a
// dry-run and will only print what it would update. Pass `--apply` to perform
// updates.

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const fileArgIndex = args.findIndex(a => a === '--file');
  const filePath = fileArgIndex !== -1 && args[fileArgIndex + 1]
    ? args[fileArgIndex + 1]
    : path.join(__dirname, '..', 'backups', 'road_geometry_backup_2025-09-17T14-15-39-297Z.json');

  console.log(`Reading backup from: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const items = JSON.parse(raw);
  console.log(`Found ${items.length} backup items.`);

  const prisma = new PrismaClient();
  try {
    let wouldUpdate = 0;
    let applied = 0;
    const missing = [];

    for (const item of items) {
      const id = item.id;
      const geometry = item.geometry; // GeoJSON geometry object
      if (!id || !geometry) continue;

      // Check if a road with this id exists
      const existing = await prisma.road.findUnique({ where: { id } });
      if (!existing) {
        missing.push(id);
        continue;
      }

      wouldUpdate++;

      if (apply) {
        // Use raw SQL to set the PostGIS geometry. Ensure SRID=4326.
        const geomJson = JSON.stringify(geometry);
        const sql = `UPDATE "road" SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1::json), 4326) WHERE id = $2`;
        await prisma.$executeRawUnsafe(sql.replace('$1::json', `'${geomJson.replace(/'/g, "''")}'`).replace('$2', `'${id}'`));
        applied++;
      }
    }

    console.log(`Would update ${wouldUpdate} rows.`);
    if (missing.length) console.log(`Missing ${missing.length} road ids (not found in DB).`);
    if (apply) console.log(`Applied updates: ${applied}`);
    else console.log('Dry-run complete. Rerun with --apply to make changes.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
