---
title: dispatch-scheduling
category: domain
appliesTo:
  - dispatch
  - scheduling
  - assignment-board
files:
  - "**/dispatch/**"
  - "**/schedule/**"
  - "**/(admin)/**"
tasks:
  - build dispatch board
  - schedule/assign jobs
  - add truck assignment to dispatch
inclusion: auto
priority: high
dependsOn:
  - domain/jobs-lifecycle.md
  - domain/trucks-fleet.md
  - domain/location-tracking.md
  - domain/auth-roles.md
governs:
  - the admin/dispatcher capabilities and what the dispatch board must show
nonGoverns:
  - the job state machine itself (see domain/jobs-lifecycle.md)
  - field agent mobile surface (see domain/field-agent-mobile-flow.md)
---

# Dispatch & Scheduling

## 1. Intent
Give `DISPATCH`/`OWNER` one operational view to schedule, assign, and monitor jobs across agents
and trucks — the back-office counterpart to the field surface.

## 2. Capabilities (dispatch/admin only)
- Create/schedule jobs; set date/time windows.
- Assign/reassign a **field agent** and optionally a **truck** to a job.
- Change job status where dispatch is permitted (per `jobs-lifecycle.md`).
- View all jobs filtered by status, agent, date, customer, and location.
- See **coarse, freshness-labeled agent locations** for active jobs (per `location-tracking.md`).

## 3. Hard rules
- Dispatch actions are **admin-role gated** server-side (`auth-roles.md`).
- Assignment/reassignment goes through the job status/assignment action — no raw writes.
- The board must **truthfully label location freshness** (e.g. "updated 4 min ago" / "stale") and
  never imply live tracking (per `location-tracking.md`).
- Manual assignment only — **no auto-routing/optimization** (non-goal).
- Double-booking (same agent, overlapping active jobs) must at least be **surfaced as a warning**;
  MVP need not hard-block, but must not hide the conflict.

## 4. What the dispatch board MUST show (MVP)
- Job identifier, customer, service location, status, scheduled window.
- Assigned agent + assigned truck (or "unassigned").
- Last known agent location + freshness for `EN_ROUTE`/`IN_PROGRESS` jobs (coarse).
- Quick filters: status, agent, today/this-week, customer.

## 5. Implementation guidance
- Server-render the board with filters as URL search params (shareable, back-button friendly).
- Use the same `transitionJob`/assignment actions as everywhere else.
- Keep the board list-first and fast; a map view is a secondary tab (see `dashboard-reporting.md`
  and `technical/maps-location-stack.md`).

## 6. Failure modes to avoid
- Building a second assignment path that bypasses the job state machine.
- Presenting stale location as live.
- Overbuilding a drag-drop calendar/optimizer in MVP.

## 7. Definition of completion
Complete when dispatch can schedule/assign/reassign agents and trucks through validated actions,
the board shows the required fields with truthful freshness labels, and all mutations are
role-gated and audited.

## 8. Escalation / decision-log
Adding auto-routing, hard double-booking prevention, or a drag-drop calendar REQUIRES a
decision-log entry.
