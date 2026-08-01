import { describe, expect, it } from "vitest";

import { JobStatus } from "@/lib/generated/prisma/enums";
import {
  assertTransition,
  IllegalJobTransitionError,
  isAssignmentBlocked,
} from "@/lib/jobs/status";

/**
 * Canonical allow-list from domain/jobs-lifecycle.md section 3. Tests derive
 * expectations from the steering doc, not from LEGAL_TRANSITIONS in the module,
 * so a drift between spec and implementation fails loudly.
 */
const LEGAL_FROM_LIFECYCLE_DOC: readonly (readonly [JobStatus, JobStatus])[] = [
  [JobStatus.DRAFT, JobStatus.SCHEDULED],
  [JobStatus.DRAFT, JobStatus.ASSIGNED],
  [JobStatus.DRAFT, JobStatus.CANCELED],
  [JobStatus.SCHEDULED, JobStatus.ASSIGNED],
  [JobStatus.SCHEDULED, JobStatus.CANCELED],
  [JobStatus.SCHEDULED, JobStatus.ON_HOLD],
  [JobStatus.ASSIGNED, JobStatus.EN_ROUTE],
  [JobStatus.ASSIGNED, JobStatus.IN_PROGRESS],
  [JobStatus.ASSIGNED, JobStatus.ON_HOLD],
  [JobStatus.ASSIGNED, JobStatus.CANCELED],
  [JobStatus.EN_ROUTE, JobStatus.IN_PROGRESS],
  [JobStatus.EN_ROUTE, JobStatus.ON_HOLD],
  [JobStatus.EN_ROUTE, JobStatus.CANCELED],
  [JobStatus.IN_PROGRESS, JobStatus.ON_HOLD],
  [JobStatus.IN_PROGRESS, JobStatus.COMPLETED],
  [JobStatus.IN_PROGRESS, JobStatus.CANCELED],
  [JobStatus.ON_HOLD, JobStatus.ASSIGNED],
  [JobStatus.ON_HOLD, JobStatus.EN_ROUTE],
  [JobStatus.ON_HOLD, JobStatus.IN_PROGRESS],
  [JobStatus.ON_HOLD, JobStatus.CANCELED],
  [JobStatus.COMPLETED, JobStatus.CLOSED],
  [JobStatus.COMPLETED, JobStatus.IN_PROGRESS],
];

/** Representative illegal transitions from jobs-lifecycle.md section 3 examples. */
const ILLEGAL_REPRESENTATIVE: readonly (readonly [JobStatus, JobStatus])[] = [
  [JobStatus.DRAFT, JobStatus.IN_PROGRESS],
  [JobStatus.DRAFT, JobStatus.COMPLETED],
  [JobStatus.SCHEDULED, JobStatus.IN_PROGRESS],
  [JobStatus.SCHEDULED, JobStatus.COMPLETED],
  [JobStatus.ASSIGNED, JobStatus.DRAFT],
  [JobStatus.EN_ROUTE, JobStatus.DRAFT],
  [JobStatus.IN_PROGRESS, JobStatus.DRAFT],
  [JobStatus.COMPLETED, JobStatus.DRAFT],
  [JobStatus.CLOSED, JobStatus.IN_PROGRESS],
  [JobStatus.CLOSED, JobStatus.ASSIGNED],
  [JobStatus.CLOSED, JobStatus.DRAFT],
  [JobStatus.CANCELED, JobStatus.ASSIGNED],
  [JobStatus.CANCELED, JobStatus.IN_PROGRESS],
];

const ALL_STATUSES = Object.values(JobStatus);

describe("assertTransition", () => {
  it.each(LEGAL_FROM_LIFECYCLE_DOC)(
    "allows legal transition %s -> %s",
    (from, to) => {
      expect(() => assertTransition(from, to)).not.toThrow();
    },
  );

  it.each(ILLEGAL_REPRESENTATIVE)(
    "rejects illegal transition %s -> %s",
    (from, to) => {
      expect(() => assertTransition(from, to)).toThrow(IllegalJobTransitionError);
      expect(() => assertTransition(from, to)).toThrow(
        `Illegal job status transition: ${from} -> ${to}.`,
      );
    },
  );
});

describe("isAssignmentBlocked", () => {
  it("returns true only for COMPLETED, CANCELED, and CLOSED", () => {
    const blocked = ALL_STATUSES.filter(isAssignmentBlocked);
    expect(blocked.sort()).toEqual(
      [JobStatus.CANCELED, JobStatus.CLOSED, JobStatus.COMPLETED].sort(),
    );
  });

  it.each([
    JobStatus.DRAFT,
    JobStatus.SCHEDULED,
    JobStatus.ASSIGNED,
    JobStatus.EN_ROUTE,
    JobStatus.IN_PROGRESS,
    JobStatus.ON_HOLD,
  ] as const)("returns false for assignable status %s", (status) => {
    expect(isAssignmentBlocked(status)).toBe(false);
  });
});
