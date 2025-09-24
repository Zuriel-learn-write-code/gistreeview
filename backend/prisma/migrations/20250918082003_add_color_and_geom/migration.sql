/*
  Warnings:

  - You are about to drop the column `geometry` on the `road` table. All the data in the column will be lost.

*/
-- DropIndex
-- drop index if exists to avoid failure on shadow DB
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'road_geom_gist') THEN
    EXECUTE 'DROP INDEX "road_geom_gist"';
  END IF;
END$$;

-- AlterTable
-- Drop the legacy geometry column if present, and ensure color is text for migration
ALTER TABLE IF EXISTS "road" DROP COLUMN IF EXISTS "geometry";
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='road' AND column_name='color'
  ) THEN
    EXECUTE 'ALTER TABLE "road" ALTER COLUMN "color" TYPE TEXT';
  END IF;
END$$;
