import type { Prisma } from "@/lib/generated/prisma/client";
import type { Role } from "@/lib/generated/prisma/enums";

/**
 * A Prisma client bound to an interactive transaction. Requiring this (instead
 * of the top-level `db`) is what enforces domain/audit-logging.md section 4:
 * the audit write shares the caller's transaction, so if the audited change
 * rolls back its audit record rolls back too, and a committed change always has
 * its audit row. It is deliberately impossible to record an audit event outside
 * a transaction through this helper.
 */
export type AuditTransactionClient = Prisma.TransactionClient;

/**
 * One audit event to append. `metadata` is a small structured context such as
 * `{ from, to }`; per domain/audit-logging.md section 4 it must never contain
 * secrets or PII beyond what is necessary.
 */
export type AuditEventInput = {
  /** The acting user, or `null` for a system-originated event. */
  actorUserId: string | null;
  actorRole: Role | null;
  /** Stable action key, e.g. `"job.assigned"`. */
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Appends one immutable audit record inside the caller's transaction.
 *
 * This is intentionally not best-effort: any failure throws and rolls the whole
 * transaction back, so the audited change cannot commit without its audit event
 * (domain/audit-logging.md section 4). Call it after the mutation write, using
 * the same `tx` handle.
 */
export async function recordAuditEvent(
  tx: AuditTransactionClient,
  event: AuditEventInput,
): Promise<void> {
  await tx.auditEvent.create({
    data: {
      actorUserId: event.actorUserId,
      actorRole: event.actorRole,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      summary: event.summary,
      ...(event.metadata === undefined ? {} : { metadata: event.metadata }),
    },
  });
}
