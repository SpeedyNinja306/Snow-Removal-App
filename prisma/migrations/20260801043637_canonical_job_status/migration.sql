-- ADR-022 (resolved): replace the foundation-ticket JobStatus enum with the
-- canonical 9-state lifecycle from docs/steering/domain/jobs-lifecycle.md
-- section 2. Explicit, idempotent backfill for the two removed values so
-- existing rows survive the type swap (schema-change-policy.md
-- expand->backfill->contract for breaking enum changes):
--   PENDING  -> DRAFT  (not yet scheduled/assigned, closest canonical state)
--   INVOICED -> CLOSED (completed + invoiced, closest canonical terminal state)
-- No other values change; ASSIGNED/IN_PROGRESS/COMPLETED are unaffected.
-- AlterEnum
BEGIN;
CREATE TYPE "JobStatus_new" AS ENUM ('DRAFT', 'SCHEDULED', 'ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELED', 'CLOSED');
ALTER TABLE "jobs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "jobs" ALTER COLUMN "status" TYPE "JobStatus_new" USING (
  CASE "status"::text
    WHEN 'PENDING' THEN 'DRAFT'
    WHEN 'INVOICED' THEN 'CLOSED'
    ELSE "status"::text
  END
)::"JobStatus_new";
ALTER TYPE "JobStatus" RENAME TO "JobStatus_old";
ALTER TYPE "JobStatus_new" RENAME TO "JobStatus";
DROP TYPE "JobStatus_old";
ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
