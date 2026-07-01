---
title: non-goals
category: foundation
appliesTo:
  - scope-control
  - all-features
files:
  - "**/*"
tasks:
  - any task that proposes new scope
inclusion: always
priority: critical
dependsOn:
  - foundation/product-goal.md
governs:
  - what SR-App will NOT do in MVP (and mostly ever)
  - scope guardrails that override feature enthusiasm
nonGoverns:
  - how in-scope features are built
---

# Non-Goals

## 1. Intent
Protect the MVP from scope creep and from features that imply capabilities we cannot honestly
deliver. Anything here is **out** unless a decision-log entry explicitly reverses it.

## 2. Hard rules — SR-App does NOT (in MVP):
- **Not** a public-facing customer portal, marketplace, or booking site. Internal tool only.
- **Not** real-time fleet telematics: no engine data, OBD, live vehicle diagnostics, or
  continuous background GPS trails. Truck tracking is assignment + optional coarse pings only
  (see `domain/trucks-fleet.md`, `domain/location-tracking.md`).
- **Not** a full accounting system. No general ledger, tax filing, payroll runs, or A/R aging
  automation. Invoices + payment *recording* only (see `domain/invoices-billing.md`).
- **Not** a native mobile app. It is a **PWA**; offline is limited and explicit
  (see `technical/pwa-offline-behavior.md`).
- **Not** a payment processor. We record payments; we do not necessarily capture card data or
  integrate a gateway in MVP unless a decision-log entry adds it (see `domain/payments.md`).
- **Not** multi-tenant SaaS. Single company, single tenant.
- **Not** a routing/optimization engine. Dispatch assigns manually; no auto-routing.
- **Not** a full HR/scheduling suite. Time tracking is per-job labor time, not payroll.
- **Not** an offline-first CRDT app. Offline covers a narrow write set only.

## 3. Implementation guidance
If a task nudges toward any item above, scope it down to the in-MVP behavior and note the
boundary in the PR/description.

## 4. Failure modes to avoid
- Sneaking telematics/accounting/gateway complexity in under a feature name.
- Implying background location tracking that a PWA cannot guarantee.

## 5. Definition of completion
A change respects non-goals when it stays inside every boundary above or cites a decision-log
entry that formally lifts a specific boundary.

## 6. Escalation / decision-log
Reversing any non-goal is an **architectural/product decision** and REQUIRES a decision-log
entry before implementation.
