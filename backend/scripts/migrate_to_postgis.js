import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import dotenv from 'dotenv';

// Load .env from current working directory (backend) when script is executed there
dotenv.config();

// This script will:
// 1. Enable PostGIS extension (requires sufficient DB privileges).
// 2. Add a `geom` column of type geometry(LineString, 4326) to `road` table if not exists.
// 3. Populate `geom` from existing `geometry` JSON column (GeoJSON -> PostGIS geometry).
// 4. Create a GIST spatial index on `geom`.
// NOTE: Make sure your DATABASE_URL in .env is correct and the DB user can create extensions.

const prisma = new PrismaClient();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Please set DATABASE_URL in environment');
  }

  // Use pg client for raw SQL operations that Prisma does not cover
  const pg = new Client({ connectionString: databaseUrl });
  await pg.connect();

  try {
    console.log('Enabling PostGIS extension (if not exists)...');
    await pg.query('CREATE EXTENSION IF NOT EXISTS postgis');

    console.log('Adding geom column if not exists...');
    await pg.query(`ALTER TABLE "road" ADD COLUMN IF NOT EXISTS geom geometry(Geometry,4326)`);

    console.log('Populating geom from geometry JSON (GeoJSON) where geom IS NULL...');
    // This SQL assumes geometry JSON is valid GeoJSON geometry object in column `geometry`.
    // It handles Point, LineString, MultiLineString, etc. We use ST_SetSRID(ST_GeomFromGeoJSON(...), 4326)
    await pg.query(
      `UPDATE "road" SET geom = ST_SetSRID(ST_GeomFromGeoJSON(geometry::text), 4326) WHERE geometry IS NOT NULL AND geom IS NULL`
    );

    console.log('Creating spatial index on geom (if not exists)...');
    await pg.query(`CREATE INDEX IF NOT EXISTS road_geom_gist ON "road" USING GIST (geom)`);

    console.log('Migration to PostGIS columns completed.');
  } finally {
    await pg.end();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
