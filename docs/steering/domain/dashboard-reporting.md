---
title: dashboard-reporting
category: domain
appliesTo:
  - dashboards
  - reporting
  - owner-oversight
files:
  - "**/dashboard/**"
  - "**/reports/**"
  - "**/(owner)/**"
tasks:
  - build owner dashboard
  - build operational reporting
  - build location map dashboard
inclusion: auto
priority: medium
dependsOn:
  - domain/jobs-lifecycle.md
  - domain/invoices-billing.md
  - domain/payments.md
  - domain/location-tracking.md
  - domain/auth-roles.md
governs:
  - read-only operational/financial oversight views for owner/admin
nonGoverns:
  - the underlying feature data rules (see each domain doc)
  - map rendering internals (see technical/maps-location-stack.md)
---

# Dashboard & Reporting

## 1. Intent
Give the **owner** (and admin) at-a-glance operational and financial oversight — derived,
read-only views over existing data. No new source-of-truth here.

## 2. MVP reports/views
- **Operational**: jobs by status, jobs scheduled today/this week, jobs by agent, open/overdue
  jobs, on-hold jobs with reasons.
- **Financial**: outstanding balance (sum of unpaid invoice balances), revenue recorded in a date
  range (sum of payments), draft vs final vs paid invoice counts. All money in cents, formatted at edge.
- **Location map view**: latest coarse agent locations for active jobs, with freshness labels
  (per `location-tracking.md`) — a map tab, secondary to list views.

## 3. Hard rules
- Dashboards are **read-only aggregations**; they never mutate and never become a second write path.
- **Numbers must reconcile with source data** — reuse the same derivation functions as
  `invoices-billing.md`/`payments.md` (e.g. `balanceDue`), do not re-implement money math.
- **Role-gated**: financial oversight is `OWNER` (and `DISPATCH` where appropriate); never exposed
  to field agents or customers.
- **Honest location**: any map/location widget obeys freshness rules and never implies live tracking.
- Prefer server-computed aggregates; paginate/limit heavy queries.

## 4. Implementation guidance
- Build reports as server components querying with indexed filters; cache where safe.
- Keep charts simple and derived; label date ranges and "as of" times explicitly.
- Empty/zero states are first-class (new business = mostly empty dashboards).

## 5. Failure modes to avoid
- Re-deriving financial totals with different logic than the billing/payments modules (drift).
- Turning a dashboard widget into a mutation surface.
- Presenting stale location as live on the map view.
- Exposing financials to the wrong role.

## 6. Definition of completion
Complete when owner/admin can view the MVP operational + financial + location views as read-only
aggregations that reconcile with source modules, are role-gated, handle empty states, and label
freshness/date ranges truthfully.

## 7. Escalation / decision-log
Adding exportable reports, custom report builders, or scheduled report emails REQUIRES a
decision-log entry.
