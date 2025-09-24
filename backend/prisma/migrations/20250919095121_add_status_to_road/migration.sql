-- CreateEnum
CREATE TYPE "RoadStatus" AS ENUM ('good', 'warning', 'danger');

-- AlterTable
ALTER TABLE "road" ADD COLUMN     "status" "RoadStatus" NOT NULL DEFAULT 'good';
