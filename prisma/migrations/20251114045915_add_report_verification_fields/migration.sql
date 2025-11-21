/*
  Warnings:

  - You are about to drop the column `verified` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedCount` on the `Report` table. All the data in the column will be lost.
  - The `status` column on the `Report` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "verified",
DROP COLUMN "verifiedCount",
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");
