"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAuditEvent } from "@/lib/audit/log";
import { getSessionUser } from "@/lib/authz";
import { DISPATCH_HOME, FIELD_HOME } from "@/lib/authz/routes";
import { db } from "@/lib/db";
import { JobStatus, Role } from "@/lib/generated/prisma/enums";
import {
  assignJobSchema,
  updateJobStatusSchema,
  type AssignJobInput,
} from "@/lib/jobs/schemas";
import {
  assertTransition,
  IllegalJobTransitionError,
  isAssignmentBlocked,
} from "@/lib/jobs/status";

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

  const previousAssignedUserId = job.assignedUserId;

  // The assignment write and its audit record share one transaction: if either
  // fails, neither persists, so a committed reassignment always leaves a trail
  // (domain/audit-logging.md section 4). Reaching this point means every guard
  // above passed, so a rejected attempt never opens a transaction and never
  // writes an audit event.
  await db.$transaction(async (tx) => {
    await tx.job.update({
      where: { id: jobId },
      data: {
        assignedUserId: userId,
        ...(transitionsToAssigned ? { status: JobStatus.ASSIGNED } : {}),
      },
    });

    await recordAuditEvent(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "job.assigned",
      entityType: "Job",
      entityId: jobId,
      summary: previousAssignedUserId
        ? `Reassigned job from ${previousAssignedUserId} to ${userId}.`
        : `Assigned job to ${userId}.`,
      metadata: { previousAssignedUserId, newAssignedUserId: userId },
    });
  });

  // Reassignment revokes the previous agent's access to the job (their field
  // list is row-scoped by assignedUserId), so both surfaces must refresh.
  revalidatePath(DISPATCH_HOME);
  revalidatePath(FIELD_HOME);

  return { ok: true };
}

export type UpdateJobStatusResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: {
        jobId?: string[];
        newStatus?: string[];
        holdReason?: string[];
        cancelReason?: string[];
      };
    };

/**
 * Advances a job's status through the single server-side state machine
 * (domain/jobs-lifecycle.md sections 3-4). Every rule is enforced here,
 * independent of what the client renders:
 *
 * - FIELD_AGENT may only transition a job assigned to them; DISPATCH/OWNER may
 *   transition any job.
 * - A FIELD_AGENT may never set CANCELED — cancellation is dispatcher-only
 *   (domain/jobs-lifecycle.md section 4).
 * - Legality is delegated to `assertTransition`; illegal (from -> to) pairs are
 *   rejected, never silently ignored.
 * - ON_HOLD requires a non-empty reason (Zod-validated), persisted on the job.
 * - CANCELED requires a non-empty reason (Zod-validated), persisted on the job.
 *   FIELD_AGENT is blocked from CANCELED above, so this only ever applies to
 *   DISPATCH/OWNER.
 *
 * The status write and its audit record share one transaction, so a committed
 * change always leaves a trail and a rejected attempt never opens a transaction
 * or writes an audit event (domain/audit-logging.md section 4).
 */
export async function updateJobStatus(
  jobId: string,
  newStatus: JobStatus,
  holdReason?: string,
  cancelReason?: string,
): Promise<UpdateJobStatusResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { ok: false, error: "You must be signed in to update a job." };
  }

  const parsed = updateJobStatusSchema.safeParse({
    jobId,
    newStatus,
    holdReason,
    cancelReason,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid status update request.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const {
    jobId: parsedJobId,
    newStatus: targetStatus,
    holdReason: reason,
    cancelReason: cancellationReason,
  } = parsed.data;

  const job = await db.job.findUnique({
    where: { id: parsedJobId },
    select: { id: true, status: true, assignedUserId: true },
  });
  if (!job) {
    return { ok: false, error: "That job no longer exists." };
  }

  // Ownership + role: a field agent is confined to their own jobs (this is a
  // second gate on top of the row-scoped query) and can never cancel a job.
  if (actor.role === Role.FIELD_AGENT) {
    if (job.assignedUserId !== actor.id) {
      return { ok: false, error: "You can only update jobs assigned to you." };
    }
    if (targetStatus === JobStatus.CANCELED) {
      return { ok: false, error: "Only dispatch or the owner can cancel a job." };
    }
  }

  // Legality lives in the state machine; a rejected transition returns a typed
  // result rather than surfacing the raw thrown error to the client.
  try {
    assertTransition(job.status, targetStatus);
  } catch (error) {
    if (error instanceof IllegalJobTransitionError) {
      return {
        ok: false,
        error: `Cannot move a job from ${error.from} to ${error.to}.`,
      };
    }
    throw error;
  }

  const previousStatus = job.status;
  const isHold = targetStatus === JobStatus.ON_HOLD;
  const isCancel = targetStatus === JobStatus.CANCELED;

  await db.$transaction(async (tx) => {
    await tx.job.update({
      where: { id: parsedJobId },
      data: {
        status: targetStatus,
        ...(isHold ? { holdReason: reason } : {}),
        ...(isCancel ? { cancelReason: cancellationReason } : {}),
      },
    });

    await recordAuditEvent(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "job.status_changed",
      entityType: "Job",
      entityId: parsedJobId,
      summary: `Job status ${previousStatus} -> ${targetStatus}.`,
      metadata: {
        previousStatus,
        newStatus: targetStatus,
        ...(isHold && reason ? { holdReason: reason } : {}),
        ...(isCancel && cancellationReason ? { cancelReason: cancellationReason } : {}),
      },
    });
  });

  // Both surfaces read this job: the agent's list and the dispatch board.
  revalidatePath(FIELD_HOME);
  revalidatePath(DISPATCH_HOME);

  return { ok: true };
}
