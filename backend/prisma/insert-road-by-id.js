// Insert a single road (name + geometry) from frontend/public/datamap/selected_roads_ambon.geojson
// Usage:
//   DATABASE_URL="postgresql://..." node prisma/insert-road-by-id.js --osm=way/44131949
// or
//   DATABASE_URL="postgresql://..." node prisma/insert-road-by-id.js --name="Jalan Wolter Monginsidi"

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (const a of args) {
    if (a.startsWith('--osm=')) out.osm = a.split('=')[1];
    if (a.startsWith('--name=')) out.name = a.split('=')[1];
    if (a === '--help') out.help = true;
  }
  return out;
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log('Usage: DATABASE_URL=... node prisma/insert-road-by-id.js --osm=way/44131949');
    process.exit(0);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const geoPath = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'datamap', 'selected_roads_ambon.geojson');
  if (!fs.existsSync(geoPath)) {
    console.error('GeoJSON not found at', geoPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(geoPath, 'utf8');
  const geo = JSON.parse(raw);
  const features = Array.isArray(geo.features) ? geo.features : [];

  let found = null;
  if (args.osm) {
    // match id or properties['@id']
    found = features.find(f => f.id === args.osm || (f.properties && f.properties['@id'] === args.osm));
  }
  if (!found && args.name) {
    const want = String(args.name).toLowerCase().trim();
    found = features.find(f => (f.properties && f.properties.name && String(f.properties.name).toLowerCase().includes(want)));
  }
  if (!found) {
    console.error('Feature not found for', args.osm || args.name);
    process.exit(1);
  }

  const name = (found.properties && found.properties.name) ? found.properties.name : (args.name || null);
  if (!name) {
    console.error('Feature has no name and no --name provided; cannot insert nameroad null');
    process.exit(1);
  }

  const geometry = found.geometry || null;

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set. To insert, run with DATABASE_URL in env, e.g.');
    console.error('DATABASE_URL="postgresql://user:pass@host:port/dbname" node prisma/insert-road-by-id.js --osm=way/44131949');
    console.log('\nPreview (would insert):');
    console.log({ nameroad: name, geometry });
    process.exit(0);
  }

  // Check existing by exact nameroad to avoid duplicates
  const existing = await prisma.road.findFirst({ where: { nameroad: name } });
  if (existing) {
    console.log('Road with same name already exists, skipping:', name, 'id=', existing.id);
    await prisma.$disconnect();
    process.exit(0);
  }

  const created = await prisma.road.create({ data: { nameroad: name, geometry } });
  console.log('Inserted road:', name, 'id=', created.id);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
