/*
  Warnings:

  - The values [good,warning,danger] on the enum `RoadStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `color` column on the `road` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RoadColor" AS ENUM ('palette_01', 'palette_02', 'palette_03', 'palette_04', 'palette_05', 'palette_06', 'palette_07', 'palette_08', 'palette_09', 'palette_10');

-- AlterEnum
BEGIN;
CREATE TYPE "RoadStatus_new" AS ENUM ('primary', 'secondary', 'tertiary', 'unknown');
ALTER TABLE "road" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "road" ALTER COLUMN "status" TYPE "RoadStatus_new" USING ("status"::text::"RoadStatus_new");
ALTER TYPE "RoadStatus" RENAME TO "RoadStatus_old";
ALTER TYPE "RoadStatus_new" RENAME TO "RoadStatus";
DROP TYPE "RoadStatus_old";
ALTER TABLE "road" ALTER COLUMN "status" SET DEFAULT 'unknown';
COMMIT;

-- AlterTable
ALTER TABLE "road" DROP COLUMN "color",
ADD COLUMN     "color" "RoadColor",
ALTER COLUMN "status" SET DEFAULT 'unknown';
