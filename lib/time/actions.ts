"use server";

import { revalidatePath } from "next/cache";

import { recordAuditEvent } from "@/lib/audit/log";
import { getSessionUser } from "@/lib/authz";
import { DISPATCH_HOME, FIELD_HOME } from "@/lib/authz/routes";
import { db } from "@/lib/db";
import { Role } from "@/lib/generated/prisma/enums";

export type ClockActionResult =
  | { ok: true; timeEntryId: string }
  | { ok: false; error: string };

/**
 * Starts an open shift for the signed-in field agent. Only FIELD_AGENT may
 * call this, and only for their own session user — there is no cross-user
 * target parameter.
 */
export async function clockIn(): Promise<ClockActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { ok: false, error: "You must be signed in to clock in." };
  }

  if (actor.role !== Role.FIELD_AGENT) {
    return { ok: false, error: "Only field agents can clock in." };
  }

  const existingOpen = await db.timeEntry.findFirst({
    where: { userId: actor.id, clockOutAt: null },
    select: { id: true },
  });
  if (existingOpen) {
    return { ok: false, error: "You are already clocked in." };
  }

  const timeEntryId = await db.$transaction(async (tx) => {
    const entry = await tx.timeEntry.create({
      data: { userId: actor.id },
      select: { id: true, clockInAt: true },
    });

    await recordAuditEvent(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "time.clock_in",
      entityType: "TimeEntry",
      entityId: entry.id,
      summary: `Clocked in at ${entry.clockInAt.toISOString()}.`,
      metadata: { clockInAt: entry.clockInAt.toISOString() },
    });

    return entry.id;
  });

  revalidatePath(FIELD_HOME);
  revalidatePath(DISPATCH_HOME);

  return { ok: true, timeEntryId };
}

/**
 * Ends the signed-in field agent's open shift. Only FIELD_AGENT may call this,
 * and only for their own session user.
 */
export async function clockOut(): Promise<ClockActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { ok: false, error: "You must be signed in to clock out." };
  }

  if (actor.role !== Role.FIELD_AGENT) {
    return { ok: false, error: "Only field agents can clock out." };
  }

  const open = await db.timeEntry.findFirst({
    where: { userId: actor.id, clockOutAt: null },
    select: { id: true, clockInAt: true },
  });
  if (!open) {
    return { ok: false, error: "You are not clocked in." };
  }

  const clockOutAt = new Date();

  await db.$transaction(async (tx) => {
    await tx.timeEntry.update({
      where: { id: open.id },
      data: { clockOutAt },
    });

    await recordAuditEvent(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "time.clock_out",
      entityType: "TimeEntry",
      entityId: open.id,
      summary: `Clocked out at ${clockOutAt.toISOString()}.`,
      metadata: {
        clockInAt: open.clockInAt.toISOString(),
        clockOutAt: clockOutAt.toISOString(),
      },
    });
  });

  revalidatePath(FIELD_HOME);
  revalidatePath(DISPATCH_HOME);

  return { ok: true, timeEntryId: open.id };
}
