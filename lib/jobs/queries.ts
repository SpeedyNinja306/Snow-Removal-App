import { db } from "@/lib/db";
import type { JobStatus } from "@/lib/generated/prisma/enums";

export type DispatchJobRow = {
  id: string;
  status: JobStatus;
  createdAt: Date;
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
 * Read-only feed for the dispatch surface. Foundation-ticket scope only: no
 * assignment/agent, truck, or filter support yet (see ADR-022).
 */
export async function listJobsForDispatchBoard(): Promise<DispatchJobRow[]> {
  return db.job.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
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
