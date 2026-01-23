-- AlterTable
ALTER TABLE "maintenance_requests" ADD COLUMN "code" TEXT NOT NULL DEFAULT 'TEMP',
ADD COLUMN "archived_at" TIMESTAMP(3);

-- Create unique index
CREATE UNIQUE INDEX "maintenance_requests_propertyId_code_key" ON "maintenance_requests"("property_id", "code");

-- Create index on code
CREATE INDEX "maintenance_requests_code_idx" ON "maintenance_requests"("code");

-- Generate random codes for existing records
UPDATE "maintenance_requests" 
SET "code" = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4))
WHERE "code" = 'TEMP';

-- Remove the default (we want it required going forward)
ALTER TABLE "maintenance_requests" ALTER COLUMN "code" DROP DEFAULT;