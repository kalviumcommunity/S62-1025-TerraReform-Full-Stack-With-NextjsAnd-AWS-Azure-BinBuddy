-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_reportId_fkey";

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
