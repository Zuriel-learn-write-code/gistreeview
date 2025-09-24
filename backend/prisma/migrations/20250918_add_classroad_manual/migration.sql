-- Safe manual migration: add classroad enum and classroad column to road
-- This file is non-destructive and uses IF NOT EXISTS guards.

-- 1) Create enum type if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'classroad') THEN
    CREATE TYPE classroad AS ENUM ('primary','secondary','tertiary','unknown');
  END IF;
END$$;

-- 2) Add column with default 'unknown' if not exists
ALTER TABLE IF EXISTS "road" ADD COLUMN IF NOT EXISTS classroad classroad DEFAULT 'unknown' NOT NULL;

-- 3) Verify (select a few rows) - not executed here, but will help when run interactively
-- SELECT id, nameroad, classroad FROM "road" LIMIT 10;
