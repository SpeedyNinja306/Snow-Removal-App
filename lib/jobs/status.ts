import { JobStatus } from "@/lib/generated/prisma/enums";

/**
 * The single server-side job status state machine (domain/jobs-lifecycle.md
 * sections 3-4). This allow-list is authoritative: any (from -> to) pair not
 * listed here is illegal and must be rejected server-side, never merely hidden
 * in the UI. Changing this table requires an ADR + coordinated migration.
 */
export const LEGAL_TRANSITIONS: Readonly<Record<JobStatus, readonly JobStatus[]>> = {
  [JobStatus.DRAFT]: [JobStatus.SCHEDULED, JobStatus.ASSIGNED, JobStatus.CANCELED],
  [JobStatus.SCHEDULED]: [JobStatus.ASSIGNED, JobStatus.CANCELED, JobStatus.ON_HOLD],
  [JobStatus.ASSIGNED]: [
    JobStatus.EN_ROUTE,
    JobStatus.IN_PROGRESS,
    JobStatus.ON_HOLD,
    JobStatus.CANCELED,
  ],
  [JobStatus.EN_ROUTE]: [JobStatus.IN_PROGRESS, JobStatus.ON_HOLD, JobStatus.CANCELED],
  [JobStatus.IN_PROGRESS]: [JobStatus.ON_HOLD, JobStatus.COMPLETED, JobStatus.CANCELED],
  [JobStatus.ON_HOLD]: [
    JobStatus.ASSIGNED,
    JobStatus.EN_ROUTE,
    JobStatus.IN_PROGRESS,
    JobStatus.CANCELED,
  ],
  // Reopening a COMPLETED job for rework returns it to IN_PROGRESS; CLOSED
  // additionally requires a finalized invoice, enforced where invoicing lives.
  [JobStatus.COMPLETED]: [JobStatus.CLOSED, JobStatus.IN_PROGRESS],
  [JobStatus.CANCELED]: [],
  [JobStatus.CLOSED]: [],
};

/** Terminal statuses accept no outbound transition. */
export const TERMINAL_STATUSES: readonly JobStatus[] = [
  JobStatus.CANCELED,
  JobStatus.CLOSED,
];

/**
 * Statuses that reject agent assignment/reassignment (ADR-023). Broader than
 * terminal: COMPLETED is still transitionable (→ CLOSED / IN_PROGRESS reopen)
 * but its agent FK is frozen until reopened.
 *
 * Allowed: DRAFT, SCHEDULED, ASSIGNED, EN_ROUTE, IN_PROGRESS, ON_HOLD.
 */
export const ASSIGNMENT_BLOCKED_STATUSES: readonly JobStatus[] = [
  JobStatus.COMPLETED,
  JobStatus.CANCELED,
  JobStatus.CLOSED,
];

export function isTerminalStatus(status: JobStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isAssignmentBlocked(status: JobStatus): boolean {
  return ASSIGNMENT_BLOCKED_STATUSES.includes(status);
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return LEGAL_TRANSITIONS[from].includes(to);
}

/** Thrown when a caller attempts a transition the allow-list forbids. */
export class IllegalJobTransitionError extends Error {
  constructor(
    readonly from: JobStatus,
    readonly to: JobStatus,
  ) {
    super(`Illegal job status transition: ${from} -> ${to}.`);
    this.name = "IllegalJobTransitionError";
  }
}

/** Guards a transition; throws `IllegalJobTransitionError` if it is not legal. */
export function assertTransition(from: JobStatus, to: JobStatus): void {
  if (!canTransition(from, to)) {
    throw new IllegalJobTransitionError(from, to);
  }
}
