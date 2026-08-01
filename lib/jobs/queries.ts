import { db } from "@/lib/db";
import { Role } from "@/lib/generated/prisma/enums";
import type { JobStatus } from "@/lib/generated/prisma/enums";

export type DispatchJobRow = {
  id: string;
  status: JobStatus;
  createdAt: Date;
  assignedUser: { id: string; email: string } | null;
  serviceLocation: {
    id: string;
    addressLine1: string;
    city: string;
    state: string;
    customer: {
      id: string;
      name: string;
    };
  };
};

/**
 * Read-only feed for the dispatch board. Includes the current agent assignment
 * so a dispatcher can see and change it. Truck, filters and location freshness
 * remain out of scope for this ticket (ADR-023).
 */
export async function listJobsForDispatchBoard(): Promise<DispatchJobRow[]> {
  return db.job.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      assignedUser: {
        select: { id: true, email: true },
      },
      serviceLocation: {
        select: {
          id: true,
          addressLine1: true,
          city: true,
          state: true,
          customer: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });
}

export type FieldAgentOption = {
  id: string;
  email: string;
};

/** Active field agents eligible to receive an assignment on the dispatch board. */
export async function listActiveFieldAgents(): Promise<FieldAgentOption[]> {
  return db.user.findMany({
    where: { role: Role.FIELD_AGENT, active: true },
    orderBy: { email: "asc" },
    select: { id: true, email: true },
  });
}

export type FieldJobRow = {
  id: string;
  status: JobStatus;
  createdAt: Date;
  serviceLocation: {
    addressLine1: string;
    city: string;
    state: string;
    customer: {
      name: string;
    };
  };
};

/**
 * Jobs assigned to a single field agent. Row scoping lives in the query
 * (`assignedUserId`), not in the UI (domain/auth-roles.md): an agent can only
 * ever read their own jobs.
 */
export async function listJobsForAgent(userId: string): Promise<FieldJobRow[]> {
  return db.job.findMany({
    where: { assignedUserId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      serviceLocation: {
        select: {
          addressLine1: true,
          city: true,
          state: true,
          customer: {
            select: { name: true },
          },
        },
      },
    },
  });
}
