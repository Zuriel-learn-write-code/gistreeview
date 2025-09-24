/*
  Warnings:

  - You are about to drop the column `classroad` on the `road` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "road" DROP COLUMN "classroad",
ADD COLUMN     "geometry" JSONB,
ALTER COLUMN "color" SET DATA TYPE TEXT;

-- DropEnum
DROP TYPE "classroad";
