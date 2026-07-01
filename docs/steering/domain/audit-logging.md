---
title: audit-logging
category: domain
appliesTo:
  - audit
  - traceability
  - compliance
files:
  - "**/lib/audit/**"
  - "**/audit/**"
  - "**/actions/**"
tasks:
  - add audit logging to an action
  - build audit event schema
  - review auditable events
inclusion: auto
priority: critical
dependsOn:
  - domain/auth-roles.md
governs:
  - which events must be audited and the minimum metadata per audit event
nonGoverns:
  - business rules of each audited feature (see that feature's doc)
---

# Audit Logging

## 1. Intent
Provide an immutable trail of *who did what, when* for the operationally and financially
significant actions — for accountability and debugging, without logging everything.

## 2. Required auditable events (minimum)
- **Auth/roles**: login success, login failure, logout, role change, user activate/deactivate.
- **Jobs**: create, status transition (from→to + reason), assignment/reassignment (agent + truck).
- **Invoices**: finalize, void, post-final correction.
- **Payments**: record payment, reverse payment, **overpayment recorded** (`payment.overpayment_recorded` when `amountPaid` exceeds grand total — metadata must include `{ overpaidDeltaCents, grandTotalCents, amountPaidCents }` per ADR-014).
- **Media/notes**: delete/hide of a note or photo.
- **Location**: tracking permission grant/deny, tracking enable/disable (coarse, not every ping).

## 3. Minimum metadata per audit event
- `id`, `occurredAt` (UTC, server time), `actorUserId` (or `system`), `actorRole`.
- `action` (enum/string), `entityType`, `entityId`.
- `summary` (human-readable), and a small structured `metadata` (e.g. `{ from, to, reason }`).
- Where relevant: request context (IP/user agent) for auth events.

## 4. Hard rules
- Audit records are **append-only and immutable** — never updated or deleted.
- Audit writes happen in the **same transaction** as the audited change; if the change commits,
  the audit exists. Do not audit from the client.
- **Never log secrets or sensitive payloads** (passwords, card data, full tokens, raw PII beyond
  what's necessary).
- Auditing failures must not silently pass — a failure to write the mandatory audit for a
  critical action fails the operation.
- Individual **location pings are NOT audit events** (too noisy) — only tracking on/off/consent is.

## 5. Implementation guidance
- Central `lib/audit/record(event)` called inside feature actions within their transaction.
- Provide an admin/owner read-only audit view filtered by entity, actor, and date.

## 6. Failure modes to avoid
- Best-effort audit that can be lost while the change persists.
- Auditing high-frequency noise (pings, reads) and drowning real events.
- Logging sensitive data into audit metadata.

## 7. Definition of completion
Complete when all required events are audited transactionally with the minimum metadata, records
are immutable, no secrets are logged, and an admin can review the trail.

## 8. Escalation / decision-log
Expanding audited events, adding external log shipping/SIEM, or changing retention REQUIRES a
decision-log entry.
