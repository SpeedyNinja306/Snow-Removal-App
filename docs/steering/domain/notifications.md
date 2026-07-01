---
title: notifications
category: domain
appliesTo:
  - notifications
  - alerts
files:
  - "**/notifications/**"
  - "**/lib/notify/**"
tasks:
  - notify agent of assignment
  - alert dispatch of status change
inclusion: agent-requested
priority: low
dependsOn:
  - domain/jobs-lifecycle.md
  - domain/auth-roles.md
governs:
  - in-app notification of key operational events (MVP scope)
nonGoverns:
  - email/SMS/push provider integration (needs a decision-log entry)
---

# Notifications

> `inclusion: agent-requested` — notifications are a thin MVP concern; pull this doc only when a
> task explicitly involves alerting users.

## 1. Intent
Keep the right person informed of the few events that matter operationally, without building a
notification platform.

## 2. MVP scope
- **In-app notifications only** for: job assigned to an agent, job status changed to a state the
  viewer cares about (e.g. dispatch sees COMPLETED/ON_HOLD/CANCELED), payment recorded.
- A simple notifications list/badge per user; mark-as-read.

## 3. Hard rules
- Notifications are **derived from real events** (job transitions, assignments, payments) — no
  fake/marketing notifications.
- Respect role scoping: a field agent is notified about **their** jobs; dispatch/owner about the fleet.
- **No email/SMS/push in MVP** unless a decision-log entry adds a provider (these have cost,
  deliverability, and consent implications).
- Notifications must not be the source of truth — they point back to the job/invoice record.

## 4. Implementation guidance
- Emit notifications from the same server transaction that produces the event (assignment,
  transition, payment), so they can't drift from reality.
- Keep a `Notification` record: recipient, type, subject ref (jobId/invoiceId), createdAt, readAt.

## 5. Failure modes to avoid
- Building a background job/email system prematurely.
- Notifications that fire without a corresponding real event.
- Cross-role leakage (agent notified about others' jobs).

## 6. Definition of completion
Complete when key events create in-app, role-scoped notifications tied to the real event, with a
read/unread list, and no external delivery channels beyond what a decision-log entry authorizes.

## 7. Escalation / decision-log
Adding email/SMS/web-push, digest scheduling, or user notification preferences REQUIRES a
decision-log entry.
