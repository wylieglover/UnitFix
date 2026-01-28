/*
  Warnings:

  - A unique constraint covering the columns `[opaque_id]` on the table `invites` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "invites" ADD COLUMN     "opaque_id" TEXT NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "invites_opaque_id_key" ON "invites"("opaque_id");

-- CreateIndex
CREATE INDEX "invites_opaque_id_idx" ON "invites"("opaque_id");
