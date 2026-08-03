import { db } from "@/lib/db";
import { Role } from "@/lib/generated/prisma/enums";

export type OpenShiftStatus = {
  isClockedIn: true;
  timeEntryId: string;
  clockInAt: Date;
} | {
  isClockedIn: false;
};

/**
 * Returns whether the given user currently has an open shift (clockOutAt is
 * null). Used by the field clock control to render initial state.
 */
export async function getOpenShiftForUser(userId: string): Promise<OpenShiftStatus> {
  const open = await db.timeEntry.findFirst({
    where: { userId, clockOutAt: null },
    orderBy: { clockInAt: "desc" },
    select: { id: true, clockInAt: true },
  });

  if (!open) {
    return { isClockedIn: false };
  }

  return {
    isClockedIn: true,
    timeEntryId: open.id,
    clockInAt: open.clockInAt,
  };
}

export type ClockedInAgentRow = {
  userId: string;
  email: string;
  timeEntryId: string;
  clockInAt: Date;
};

/**
 * Active field agents with an open shift, for dispatch visibility. Only
 * includes active FIELD_AGENT users.
 */
export async function listCurrentlyClockedInAgents(): Promise<ClockedInAgentRow[]> {
  const entries = await db.timeEntry.findMany({
    where: {
      clockOutAt: null,
      user: { role: Role.FIELD_AGENT, active: true },
    },
    orderBy: { clockInAt: "asc" },
    select: {
      id: true,
      clockInAt: true,
      user: {
        select: { id: true, email: true },
      },
    },
  });

  return entries.map((entry) => ({
    userId: entry.user.id,
    email: entry.user.email,
    timeEntryId: entry.id,
    clockInAt: entry.clockInAt,
  }));
}
