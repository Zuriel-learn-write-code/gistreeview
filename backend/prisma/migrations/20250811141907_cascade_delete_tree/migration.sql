-- DropForeignKey
ALTER TABLE "TreePicture" DROP CONSTRAINT "TreePicture_treeId_fkey";

-- DropForeignKey
ALTER TABLE "report" DROP CONSTRAINT "report_treeId_fkey";

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreePicture" ADD CONSTRAINT "TreePicture_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
