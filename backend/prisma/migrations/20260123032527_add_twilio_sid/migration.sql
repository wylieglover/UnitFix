/*
  Warnings:

  - A unique constraint covering the columns `[maintenance_phone_number]` on the table `properties` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[twilio_sid]` on the table `properties` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "twilio_sid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "properties_maintenance_phone_number_key" ON "properties"("maintenance_phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "properties_twilio_sid_key" ON "properties"("twilio_sid");
