#!/usr/bin/env node
/**
 * Simple importer: reads a GeoJSON file and inserts roads into the `road` table
 * using the project's Prisma client. By default this script performs a dry-run
 * (logs what it would insert). Pass `--apply` to actually write to the DB.
 *
 * Usage (from repository root):
 *   node backend/scripts/import-roads-to-db.js --file ../frontend/public/datamap/selected_roads_ambon.geojson --apply
 */

import fs from "fs/promises";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const getArg = (name, fallback) => {
  const idx = args.findIndex((a) => a === name);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
};

const FILE = getArg("--file", path.resolve(__dirname, "../../frontend/public/datamap/selected_roads_ambon.geojson"));
const APPLY = args.includes("--apply");

async function main() {
  console.log(`Reading geojson from ${FILE}`);
  const raw = await fs.readFile(FILE, "utf8");
  const geo = JSON.parse(raw);
  if (!geo || !Array.isArray(geo.features)) {
    console.error("Invalid GeoJSON: missing features array");
    process.exit(1);
  }

  // Defer importing Prisma to runtime so the script can be used in other contexts
  const { default: prisma } = await import("../src/prismaClient.js");

  console.log(`Found ${geo.features.length} features. APPLY=${APPLY}`);

  let inserted = 0;
  for (const feat of geo.features) {
    try {
      const props = feat.properties || {};
      const name = props.name || props.nameroad || props.road || null;
      const description = props.description || null;

      // GeoJSON geometry object string for PostGIS
      const geomObj = feat.geometry || null;
      if (!geomObj) continue;

      // Prepare the record payload for Prisma (geom handled separately via raw SQL)
      const payload = {
        nameroad: name,
        description,
      };

      if (!APPLY) {
        console.log("DRY-RUN: would create road:", payload);
        continue;
      }

      // Create the road row
      const created = await prisma.road.create({ data: payload });

      // Set the PostGIS geometry using raw SQL. Prisma marks `geom` as Unsupported,
      // so we use an UPDATE with ST_SetSRID(ST_GeomFromGeoJSON(...), 4326).
      const geomJson = JSON.stringify(geomObj);
      // Use parameterized query to avoid injection. pg client is used under the hood by Prisma.$executeRawUnsafe
      // but Prisma's $executeRaw supports parameterized values via Prisma.sql in newer versions. To keep this simple
      // we use $executeRawUnsafe with explicit escaping -- however we will pass the JSON as a parameter via $queryRaw.
      // Use $queryRaw with tag to ensure parameterization.
      try {
        // Note: Prisma's $executeRaw does not accept parameterized values for identifiers, but accepts values.
        await prisma.$executeRaw`
          UPDATE "road"
          SET geom = ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326)
          WHERE id = ${created.id}
        `;
      } catch (e) {
        console.error("Failed to update geom for road id", created.id, e.message || e);
      }

      inserted++;
    } catch (err) {
      console.error("Error processing feature:", err.message || err);
    }
  }

  console.log(`Done. Inserted (applied) ${inserted} roads.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
