// Import all roads from frontend/public/datamap/selected_roads_ambon.geojson
// Usage: from backend/ folder: node prisma/import-all-roads.js [--dry-run]
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const geoPath = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'datamap', 'selected_roads_ambon.geojson');

function normalizeName(n) {
  if (!n) return '';
  return String(n).trim();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
  if (!fs.existsSync(geoPath)) {
    console.error('GeoJSON not found at', geoPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(geoPath, 'utf8');
  const geo = JSON.parse(raw);
  const features = Array.isArray(geo.features) ? geo.features : [];

  const inserted = [];
  for (const f of features) {
    // Determine candidate name from properties or fallback
    const hasPropName = Boolean(f.properties && (f.properties.name || f.properties.nameroad));
    const propName = hasPropName ? normalizeName(f.properties.name || f.properties.nameroad) : '';
    const fallbackName = (f.properties && f.properties['name:en']) || (f.properties && f.properties['ref']) || '';
    let nameCandidate = propName || normalizeName(fallbackName) || (f.id || '');
    const geom = f.geometry || null;

    // If the only identifier is an OSM id like 'way/12345', we keep nameroad NULL
    const onlyOsmId = !hasPropName && !!(f.id) && (/^(?:way|node|relation)\/\d+$/.test(String(f.id)));
    let name = null;
    if (!onlyOsmId) {
      // set a usable name; if empty, mark as 'unknown'
      name = normalizeName(nameCandidate) || 'unknown';
    }

    if (dryRun) {
      inserted.push({ nameroad: name, source_osm_id: f.id || undefined });
      console.log('[dry-run] would insert', name || `(no nameroad) ${String(f.id || '')}`);
      continue;
    }

    try {
      // collect some OSM metadata when present
      const source_osm_id = f.id || undefined;
      const osm_type = source_osm_id ? String(source_osm_id).split('/')[0] : undefined;
      const osm_tags = (f.properties && f.properties.tags) ? f.properties.tags : undefined;
      const osm_properties = f.properties ? f.properties : undefined;

      // duplicate checks: by nameroad when present, otherwise by source_osm_id
      if (name) {
        const exists = await prisma.road.findFirst({ where: { nameroad: name } });
        if (exists) {
          console.log('Exists, skipping:', name);
          continue;
        }
      } else if (source_osm_id) {
        const existsByOsm = await prisma.road.findFirst({ where: { source_osm_id: String(source_osm_id) } });
        if (existsByOsm) {
          console.log('Exists by osm id, skipping:', String(source_osm_id));
          continue;
        }
      }

      // build create payload; omit nameroad when null to leave DB column NULL
      const createData = {
        description: '',
        geometry: geom || undefined,
        color: 'palette_01',
        status: 'unknown',
        source_osm_id,
        osm_type,
        osm_tags,
        osm_properties
      };
      if (name) createData.nameroad = name;

      const created = await prisma.road.create({ data: createData });
      console.log('Inserted', name || `(no nameroad) ${String(source_osm_id || '')}`, 'id=' + created.id);
      inserted.push(created);
    } catch (e) {
      console.error('Failed to insert', name, e.message || e);
    }
  }

  console.log('\nImport complete. Inserted count:', inserted.length);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
