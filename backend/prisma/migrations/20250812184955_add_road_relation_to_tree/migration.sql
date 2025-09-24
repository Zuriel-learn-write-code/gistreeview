/*
  Warnings:

  - You are about to drop the column `street_name` on the `tree` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tree" DROP COLUMN "street_name",
ADD COLUMN     "roadId" TEXT;

-- AddForeignKey
ALTER TABLE "tree" ADD CONSTRAINT "tree_roadId_fkey" FOREIGN KEY ("roadId") REFERENCES "road"("id") ON DELETE SET NULL ON UPDATE CASCADE;
