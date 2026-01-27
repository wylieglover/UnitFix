/*
  Warnings:

  - You are about to drop the column `twilio_sid` on the `properties` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[twilio_phone_number]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[twilio_sid]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "properties_twilio_sid_key";

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "twilio_phone_number" TEXT,
ADD COLUMN     "twilio_sid" TEXT;

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "twilio_sid";

-- CreateIndex
CREATE UNIQUE INDEX "organizations_twilio_phone_number_key" ON "organizations"("twilio_phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_twilio_sid_key" ON "organizations"("twilio_sid");
