---
title: product-goal
category: foundation
appliesTo:
  - all-features
  - product-direction
files:
  - "**/*"
tasks:
  - any task in this repository
inclusion: always
priority: critical
dependsOn: []
governs:
  - the product's purpose, users, and success definition
  - what "good" looks like for any feature
nonGoverns:
  - implementation details (see technical/*)
  - specific feature rules (see domain/*)
---

# Product Goal

## 1. Intent
SR-App exists to run the daily operations of a **snowmobile field service company** from
one internal tool. It must make **field agents fast on a phone**, give **dispatch/admin real
operational visibility**, and give the **owner** financial and operational oversight — without
enterprise bloat.

The north star: **a field agent can go from "assigned a job" to "job done + invoice + payment
recorded" on a phone, in the field, with minimal taps and tolerance for bad signal**, while
dispatch watches it happen.

## 2. Hard rules
- Every feature must serve at least one of the three users: **field agent, dispatch/admin, owner**.
- **Field speed wins** over admin richness when they conflict on the mobile surface.
- The system of record is the **Job**. Customers, locations, invoices, time, notes, photos,
  and location pings hang off jobs (or off entities jobs reference).
- Truthfulness over impressiveness: never present a capability that isn't really delivered.

## 3. Implementation guidance
- When designing any feature, state which user it serves and which core workflow it advances
  (see `docs/product-spec.md`).
- Prefer completing a thin end-to-end slice of the job lifecycle over broad half-built features.

## 4. Failure modes to avoid
- Building admin-console richness that slows the field surface.
- Adding features with no clear user among the three.
- Drifting toward a generic CRM instead of a field-service operations tool.

## 5. Definition of completion
A feature aligns with the product goal when it (a) serves a named user, (b) advances a named
workflow in `product-spec.md`, and (c) does not violate `non-goals.md`.

## 6. Escalation / decision-log
If a proposed feature does not clearly serve one of the three users or conflicts with the
north star, **stop and log a decision** per `decision-log-policy.md` before building.
