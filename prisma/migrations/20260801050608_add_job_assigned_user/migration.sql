-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "assignedUserId" TEXT;

-- CreateIndex
CREATE INDEX "jobs_assignedUserId_idx" ON "jobs"("assignedUserId");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
