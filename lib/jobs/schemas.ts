import { z } from "zod";

import { JobStatus } from "@/lib/generated/prisma/enums";

/** Shared by the dispatch assign control and the `assignJob` server action. */
export const assignJobSchema = z.object({
  jobId: z.cuid({ error: "A valid job is required." }),
  userId: z.cuid({ error: "A valid field agent is required." }),
});

export type AssignJobInput = z.infer<typeof assignJobSchema>;

/**
 * Shared by the field status control and the `updateJobStatus` server action.
 * Transition *legality* is not encoded here — that lives in the single state
 * machine (`lib/jobs/status`). This schema only guards shape and the
 * ON_HOLD-needs-a-reason invariant (domain/jobs-lifecycle.md section 4). The
 * reason is trimmed so whitespace-only input cannot satisfy the requirement.
 */
export const updateJobStatusSchema = z
  .object({
    jobId: z.cuid({ error: "A valid job is required." }),
    newStatus: z.enum(JobStatus, { error: "A valid target status is required." }),
    holdReason: z.string().trim().min(1).optional(),
    cancelReason: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) => data.newStatus !== JobStatus.ON_HOLD || Boolean(data.holdReason),
    { error: "A reason is required to place a job on hold.", path: ["holdReason"] },
  )
  .refine(
    (data) => data.newStatus !== JobStatus.CANCELED || Boolean(data.cancelReason),
    { error: "A reason is required to cancel a job.", path: ["cancelReason"] },
  );

export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
