-- DropForeignKey
ALTER TABLE "RoadPicture" DROP CONSTRAINT "RoadPicture_roadId_fkey";

-- AddForeignKey
ALTER TABLE "RoadPicture" ADD CONSTRAINT "RoadPicture_roadId_fkey" FOREIGN KEY ("roadId") REFERENCES "road"("id") ON DELETE CASCADE ON UPDATE CASCADE;
