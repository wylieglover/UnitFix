/*
  Warnings:

  - You are about to drop the column `accepted_at` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `invites` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `invites` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_organization_id_fkey";

-- DropIndex
DROP INDEX "invites_email_organization_id_key";

-- DropIndex
DROP INDEX "invites_token_idx";

-- AlterTable
ALTER TABLE "invites" DROP COLUMN "accepted_at",
DROP COLUMN "created_at",
DROP COLUMN "created_by",
DROP COLUMN "expires_at",
DROP COLUMN "organization_id",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "organizationId" INTEGER,
ADD COLUMN     "propertyId" INTEGER,
ALTER COLUMN "email" SET DATA TYPE CITEXT;

-- CreateIndex
CREATE INDEX "invites_email_idx" ON "invites"("email");

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
