-- AlterTable
ALTER TABLE "maintenance_requests" ADD COLUMN     "assigned_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "maintenance_requests_assigned_to_idx" ON "maintenance_requests"("assigned_to");
