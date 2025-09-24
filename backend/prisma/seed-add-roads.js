// Seed script: add specific roads from frontend/public/datamap/selected_roads_ambon.geojson
// Usage: from repository root run `node backend/prisma/seed-add-roads.js` (backend package.json has "type":"module")
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

const REQUESTED = [
  "Jalan Pattimura",
  "Jalan Ahmad Yani",
  "Jalan Diponegoro",
  "Jalan Jan Paays",
  "Jalan Sultan Hairun",
  "Jalan Slamet Riyadi",
  "Am Sangaji",
  // users typed "jalan aypatty" — map to common variants of A.Y. Patty
  "Jalan A.Y. Patty",
  "A.Y. Patty",
  "A.Y Patty",
  "Aypatty",
  "Jalan Aypatty",
];

function normalize(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
  const plannedInserts = [];
  // resolve the geojson path relative to this file in a cross-platform way
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

  // simple palette fallback
  const paletteByName = {
    'jalan pattimura': 'palette_02',
    'jalan ahmad yani': 'palette_03',
    'jalan diponegoro': 'palette_04',
    'jalan jan paays': 'palette_05',
    'jalan sultan hairun': 'palette_06',
    'jalan slamet riyadi': 'palette_07',
    'am sangaji': 'palette_08',
    'jalan a.y. patty': 'palette_09',
    'a.y. patty': 'palette_09',
    'aypatty': 'palette_09'
  };

  for (const wanted of REQUESTED) {
    const wantNorm = normalize(wanted);
    // find first feature whose name matches (normalized contains or equals)
    const found = features.find((f) => {
      const name = normalize((f.properties && (f.properties.name || f.properties['addr:street'])) || f.properties && f.properties['ref'] || '');
      // match substring or exact
      if (!name) return false;
      if (name === wantNorm) return true;
      if (name.includes(wantNorm)) return true;
      // also allow wanted to be a substring of name
      if (wantNorm.includes(name) && name.length > 3) return true;
      return false;
    });

    if (!found) {
      console.warn(`No feature found in GeoJSON for "${wanted}"`);
      continue;
    }

    // prepare nameroad exactly as requested (use official name if available)
    const featureName = (found.properties && found.properties.name) ? found.properties.name : wanted;

    // check existing road by exact nameroad
    const existing = await prisma.road.findFirst({ where: { nameroad: featureName } });
    if (existing) {
      console.log(`Road already exists, skipping: ${featureName} (id: ${existing.id})`);
      continue;
    }

    const geom = found.geometry || null;
    const colorKey = paletteByName[normalize(featureName)] || 'palette_01';
    const source_osm_id = found.id || (found.properties && found.properties['@id']) || null;
    const osm_type = source_osm_id ? String(source_osm_id).split('/')[0] : null;
    const osm_tags = found.properties ? (() => {
      // copy only simple tag-like entries (strings/numbers/booleans)
      const out = {};
      for (const k of Object.keys(found.properties || {})) {
        const v = found.properties[k];
        if (v === null) continue;
        const t = typeof v;
        if (t === 'string' || t === 'number' || t === 'boolean') out[k] = v;
      }
      return Object.keys(out).length ? out : null;
    })() : null;
    const osm_properties = found.properties || null;

    if (dryRun) {
      plannedInserts.push({ nameroad: featureName, description: `Imported from selected_roads_ambon.geojson (osm id: ${found.id || (found.properties && found.properties['@id']) || 'unknown'})`, geometry: geom, color: colorKey, source_osm_id, osm_type, osm_tags, osm_properties });
      console.log(`[dry-run] Would insert road: ${featureName} (osm: ${source_osm_id})`);
    } else {
      const created = await prisma.road.create({
        data: {
          nameroad: featureName,
          description: `Imported from selected_roads_ambon.geojson (osm id: ${found.id || (found.properties && found.properties['@id']) || 'unknown'})`,
          geometry: geom,
          color: colorKey,
          source_osm_id,
          osm_type,
          osm_tags: osm_tags || undefined,
          osm_properties: osm_properties || undefined,
        }
      });
      console.log(`Inserted road: ${featureName} id=${created.id}`);
    }
  }

  if (dryRun) {
    console.log('\nDry-run summary: the following roads would be inserted:');
    for (const r of plannedInserts) console.log('-', r.nameroad);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
