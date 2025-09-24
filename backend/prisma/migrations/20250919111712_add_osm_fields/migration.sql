-- AlterTable
ALTER TABLE "road" ADD COLUMN     "osm_properties" JSONB,
ADD COLUMN     "osm_tags" JSONB,
ADD COLUMN     "osm_type" TEXT,
ADD COLUMN     "source_osm_id" TEXT;
