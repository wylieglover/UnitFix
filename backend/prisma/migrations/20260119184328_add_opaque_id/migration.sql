/*
  Warnings:

  - A unique constraint covering the columns `[opaqueId]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[opaqueId]` on the table `properties` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,property_id]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[opaqueId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "opaqueId" TEXT NOT NULL DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "opaqueId" TEXT NOT NULL DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "opaqueId" TEXT NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE INDEX "invites_phone_idx" ON "invites"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_opaqueId_key" ON "organizations"("opaqueId");

-- CreateIndex
CREATE UNIQUE INDEX "properties_opaqueId_key" ON "properties"("opaqueId");

-- CreateIndex
CREATE INDEX "tenants_user_id_idx" ON "tenants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_user_id_property_id_key" ON "tenants"("user_id", "property_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_opaqueId_key" ON "users"("opaqueId");
