/*
  Warnings:

  - You are about to drop the column `acceptedAt` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `invites` table. All the data in the column will be lost.
  - Added the required column `created_by` to the `invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `invites` table without a default value. This is not possible if the table is not empty.
  - Made the column `organizationId` on table `invites` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_propertyId_fkey";

-- AlterTable
ALTER TABLE "invites" DROP COLUMN "acceptedAt",
DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
ADD COLUMN     "accepted_at" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" INTEGER NOT NULL,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "maintenance_role" "MaintenanceRole",
ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "invites_token_idx" ON "invites"("token");

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
