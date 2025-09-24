-- DropForeignKey
ALTER TABLE "ReportPicture" DROP CONSTRAINT "ReportPicture_reportId_fkey";

-- AddForeignKey
ALTER TABLE "ReportPicture" ADD CONSTRAINT "ReportPicture_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
