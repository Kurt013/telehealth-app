/*
  Warnings:

  - You are about to drop the column `date` on the `DoctorSchedule` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "DoctorSchedule_doctorId_date_idx";

-- AlterTable
ALTER TABLE "DoctorSchedule" DROP COLUMN "date";

-- CreateIndex
CREATE INDEX "DoctorSchedule_doctorId_idx" ON "DoctorSchedule"("doctorId");
