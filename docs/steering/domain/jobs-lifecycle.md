---
title: jobs-lifecycle
category: domain
appliesTo:
  - jobs
  - job-status
  - assignment
files:
  - "**/jobs/**"
  - "**/lib/jobs/**"
  - "**/actions/job*/**"
tasks:
  - create/edit jobs
  - change job status
  - assign agent/truck to a job
  - build job schema
inclusion: auto
priority: critical
dependsOn:
  - domain/auth-roles.md
  - domain/audit-logging.md
  - domain/invoices-billing.md
governs:
  - the Job entity, its canonical status set, legal/illegal transitions, assignment, timestamps
nonGoverns:
  - invoice states (see domain/invoices-billing.md)
  - dispatch UI (see domain/dispatch-scheduling.md)
  - time entries (see domain/time-tracking.md)
---

# Jobs Lifecycle

## 1. Intent
The **Job** is the operational system of record. This doc fixes its states and transitions so
every agent implements the same workflow.

## 2. Canonical statuses (exact set — do not invent others)
1. `DRAFT` — created, not yet scheduled/assigned.
2. `SCHEDULED` — has a scheduled date/time window; may or may not be assigned yet.
3. `ASSIGNED` — assigned to a field agent (and optionally a truck).
4. `EN_ROUTE` — agent has started traveling to the site.
5. `IN_PROGRESS` — agent is on-site working.
6. `ON_HOLD` — paused (waiting on parts, customer, weather). Must carry a reason.
7. `COMPLETED` — work finished on-site; ready for/attached to invoicing.
8. `CANCELED` — job will not be performed. Terminal. Must carry a reason.
9. `CLOSED` — completed **and** invoice finalized (and paid or intentionally closed). Terminal.

## 3. Legal transitions (allow-list; everything else is illegal)
- `DRAFT` → `SCHEDULED`, `ASSIGNED`, `CANCELED`
- `SCHEDULED` → `ASSIGNED`, `CANCELED`, `ON_HOLD`
- `ASSIGNED` → `EN_ROUTE`, `IN_PROGRESS`, `ON_HOLD`, `CANCELED`
- `EN_ROUTE` → `IN_PROGRESS`, `ON_HOLD`, `CANCELED`
- `IN_PROGRESS` → `ON_HOLD`, `COMPLETED`, `CANCELED`
- `ON_HOLD` → `ASSIGNED`, `EN_ROUTE`, `IN_PROGRESS`, `CANCELED`
- `COMPLETED` → `CLOSED`, `IN_PROGRESS` (reopen for rework)
- `CANCELED` → (terminal)
- `CLOSED` → (terminal)

### Explicitly ILLEGAL transitions (examples, non-exhaustive)
- Any status → `DRAFT` (cannot un-create).
- `CLOSED`/`CANCELED` → anything.
- `DRAFT`/`SCHEDULED` → `IN_PROGRESS`/`COMPLETED` (must be assigned first).
- `COMPLETED` → `CLOSED` **without a finalized invoice** (see `invoices-billing.md`).

## 4. Hard rules
- Transition legality is enforced by a **single server-side state machine** (`lib/jobs/status`),
  not scattered across UI. Illegal transitions are rejected with a clear error.
- **Assignment:** only `DISPATCH`/`OWNER` may assign/reassign. A field agent may advance status
  only on **their own** assigned job. Reassigning away from an agent revokes their access.
- **Truck assignment** is optional and independent of agent assignment
  (see `domain/trucks-fleet.md`).
- **`ON_HOLD` and `CANCELED` require a reason** string.
- `COMPLETED` → `CLOSED` requires a **finalized invoice** for the job.
- **Timestamps:** persist `createdAt`, `scheduledAt`, `assignedAt`, `enRouteAt`, `startedAt`
  (IN_PROGRESS), `completedAt`, `canceledAt`, `closedAt` as they occur. Never fabricate a
  timestamp for a state that didn't happen.
- **Every status change and (re)assignment is an audited event** with actor, from→to, and reason
  (see `domain/audit-logging.md`).

## 5. Implementation guidance
- Model status as a Prisma enum matching the exact set above.
- Expose one `transitionJob(jobId, toStatus, {reason})` action that validates role, ownership,
  legality, and side effects (timestamps, audit) atomically in a transaction.
- Derive available UI actions from the state machine, not hardcoded per screen.

## 6. Failure modes to avoid
- Allowing arbitrary status edits via a raw update.
- Setting `CLOSED` without an invoice, or fabricating timestamps.
- Letting a field agent transition a job that isn't theirs.
- Duplicating transition logic between mobile and admin surfaces.

## 7. Definition of completion
Complete when the enum + state machine exist, all transitions go through the single validated
action, illegal transitions are rejected and tested, timestamps are recorded truthfully, and
changes are audited.

## 8. Escalation / decision-log
Adding/removing a status or changing the transition allow-list REQUIRES a decision-log entry and
a coordinated `process/schema-change-policy.md` migration.
