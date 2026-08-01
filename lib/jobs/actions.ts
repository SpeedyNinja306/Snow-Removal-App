"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionUser } from "@/lib/authz";
import { DISPATCH_HOME, FIELD_HOME } from "@/lib/authz/routes";
import { db } from "@/lib/db";
import { JobStatus, Role } from "@/lib/generated/prisma/enums";
import { assignJobSchema, type AssignJobInput } from "@/lib/jobs/schemas";
import { assertTransition, isAssignmentBlocked } from "@/lib/jobs/status";

export type AssignJobResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: { jobId?: string[]; userId?: string[] };
    };

/**
 * Assigns (or reassigns) a field agent to a job. The only write path for agent
 * assignment (domain/jobs-lifecycle.md section 4, dispatch-scheduling.md
 * section 3): every rule below is enforced server-side, independent of what the
 * client sends.
 *
 * - Only DISPATCH/OWNER may call it.
 * - COMPLETED / CANCELED / CLOSED reject (ADR-023); other statuses allow.
 * - The target must be an active FIELD_AGENT.
 * - An unassigned DRAFT/SCHEDULED job transitions to ASSIGNED via the state
 *   machine; any other assignable status is reassigned by updating the FK only,
 *   with no status change (ADR-023).
 */
export async function assignJob(input: AssignJobInput): Promise<AssignJobResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { ok: false, error: "You must be signed in to assign jobs." };
  }

  // Role re-checked against the DB-backed session (ADR-015), not the client.
  if (actor.role !== Role.OWNER && actor.role !== Role.DISPATCH) {
    return { ok: false, error: "Only dispatch or the owner can assign jobs." };
  }

  const parsed = assignJobSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid assignment request.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { jobId, userId } = parsed.data;

  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { id: true, status: true, assignedUserId: true },
  });
  if (!job) {
    return { ok: false, error: "That job no longer exists." };
  }
  if (isAssignmentBlocked(job.status)) {
    return {
      ok: false,
      error: `A ${job.status} job is closed to assignment.`,
    };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, active: true },
  });
  if (!target || !target.active || target.role !== Role.FIELD_AGENT) {
    return { ok: false, error: "Jobs can only be assigned to an active field agent." };
  }

  // DRAFT/SCHEDULED are the only statuses whose assignment implies a status
  // change; routing it through the state machine keeps legality in one place.
  const transitionsToAssigned =
    job.status === JobStatus.DRAFT || job.status === JobStatus.SCHEDULED;
  if (transitionsToAssigned) {
    assertTransition(job.status, JobStatus.ASSIGNED);
  }

  await db.job.update({
    where: { id: jobId },
    data: {
      assignedUserId: userId,
      ...(transitionsToAssigned ? { status: JobStatus.ASSIGNED } : {}),
    },
  });

  // Reassignment revokes the previous agent's access to the job (their field
  // list is row-scoped by assignedUserId), so both surfaces must refresh.
  revalidatePath(DISPATCH_HOME);
  revalidatePath(FIELD_HOME);

  return { ok: true };
}
