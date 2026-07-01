---
title: time-tracking
category: domain
appliesTo:
  - time-entries
  - labor-time
files:
  - "**/time/**"
  - "**/lib/time/**"
tasks:
  - implement job time tracking
  - build time entry schema
inclusion: auto
priority: medium
dependsOn:
  - domain/jobs-lifecycle.md
  - domain/invoices-billing.md
  - domain/audit-logging.md
governs:
  - labor time logged against jobs (start/stop + manual entries)
nonGoverns:
  - payroll/pay rates (non-goal)
  - invoice line items (see domain/invoices-billing.md)
---

# Time Tracking

## 1. Intent
Capture **labor time spent on a job** so it can inform invoicing and give the owner visibility.
This is job labor time, **not** payroll/timesheets (see `foundation/non-goals.md`).

## 2. Hard rules
- A **Time Entry** belongs to a Job and an agent: `startedAt`, `endedAt` (nullable while running),
  derived `durationMinutes`, optional note.
- **One active (running) time entry per agent at a time.** Starting a new timer **auto-stops the
  previously running one** (sets its `endedAt = now`) in a single server transaction, and the
  auto-stop is audited (decided in ADR-012).
- Support both a **start/stop timer** (field-friendly, one tap) and **manual entry/correction**
  of start/end.
- Duration is **computed server-side** from timestamps; never trust a client-sent duration.
- Time entries can be **edited/corrected** while the job is not `CLOSED`; edits are audited.
- Time data may feed a suggested `LABOR` line item on the invoice but does **not** auto-bill —
  the agent/admin decides what to bill (keeps `invoices-billing.md` authoritative on charges).
- Field agents manage time only on **their own** jobs.

## 3. Implementation guidance
- Store timestamps in UTC; compute duration on read/close.
- Make start/stop a single prominent action on the field job screen (per `field-agent-mobile-flow.md`).
- Handle offline: a start/stop while offline queues with its real timestamp (per `pwa-offline-behavior.md`).

## 4. Failure modes to avoid
- Trusting client-provided durations.
- Multiple concurrent running timers for one agent.
- Auto-billing labor without a human decision.
- Losing an offline-recorded start/stop.

## 5. Definition of completion
Complete when agents can start/stop and manually enter/correct labor time on their jobs, only one
timer runs per agent (a new start auto-stops the previous per ADR-012), durations are server-computed,
edits are audited, and time can optionally seed (not force) an invoice labor line.

## 6. Escalation / decision-log
Adding pay rates, payroll export, or overtime rules REQUIRES a decision-log entry.
