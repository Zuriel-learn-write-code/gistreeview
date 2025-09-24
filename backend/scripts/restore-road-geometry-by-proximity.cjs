// restore-road-geometry-by-proximity.cjs
// Attempts to match backup geometries (GeoJSON) to existing `road` rows by
// finding the nearest existing road (using centroid) within a distance
// threshold (in meters). This is safer when UUIDs don't match but geometries
// overlap. Dry-run by default; pass `--apply` to update.

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

  const thresholdMeters = 20; // matching distance threshold

  console.log(`Reading backup from: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const items = JSON.parse(raw);
  console.log(`Found ${items.length} backup items.`);

  const prisma = new PrismaClient();
  try {
    let candidates = 0;
    let applied = 0;
    const unmatched = [];

    for (const item of items) {
      const geometry = item.geometry;
      if (!geometry) continue;

      // Build GeoJSON Feature to pass to PostGIS
      const geomJson = JSON.stringify(geometry).replace(/'/g, "''");

      // Find nearest road by centroid distance (in meters) using ST_DistanceSphere
      const findSql = `
        SELECT id, ST_DistanceSphere(ST_Centroid(geom), ST_SetSRID(ST_GeomFromGeoJSON('${geomJson}'::json), 4326)) AS dist
        FROM "road"
        WHERE geom IS NOT NULL
        ORDER BY dist ASC
        LIMIT 1
      `;

      const rows = await prisma.$queryRawUnsafe(findSql);
      if (!rows || rows.length === 0) {
        unmatched.push({ itemId: item.id });
        continue;
      }

      const nearest = rows[0];
      const dist = nearest.dist;

      if (dist <= thresholdMeters) {
        candidates++;
        if (apply) {
          const updateSql = `UPDATE "road" SET geom = ST_SetSRID(ST_GeomFromGeoJSON('${geomJson}'::json), 4326) WHERE id = '${nearest.id}'`;
          await prisma.$executeRawUnsafe(updateSql);
          applied++;
        } else {
          console.log(`Would update road id=${nearest.id} (dist=${Math.round(dist)}m)`);
        }
      } else {
        unmatched.push({ itemId: item.id, nearestId: nearest.id, dist });
      }
    }

    console.log(`Candidate matches within ${thresholdMeters}m: ${candidates}`);
    if (unmatched.length) console.log(`Unmatched items: ${unmatched.length}`);
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
