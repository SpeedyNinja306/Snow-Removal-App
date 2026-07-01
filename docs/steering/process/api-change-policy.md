---
title: api-change-policy
category: process
appliesTo:
  - action-contracts
  - api-governance
files:
  - "**/actions.ts"
  - "**/actions/**"
  - "app/api/**"
tasks:
  - change a server action signature/result
  - change a route handler contract
inclusion: agent-requested
priority: high
dependsOn:
  - technical/api-actions-validation.md
  - foundation/decision-log-policy.md
governs:
  - how mutation/handler contracts change without breaking callers
nonGoverns:
  - how to write a new action (see technical/api-actions-validation.md)
---

# API / Action Change Policy

## 1. Intent
Keep server action + route-handler contracts stable so UI and offline queue callers don't break.

## 2. Hard rules
- **Prefer additive changes**: new optional input fields, new result fields. Avoid changing/removing
  existing input/result fields in place.
- **Breaking a contract** (renaming/removing a field, changing result shape, tightening validation
  that rejects previously-valid input) requires: updating **all callers** in the same change +
  an ADR if the change is architecturally significant.
- The **offline queue** encodes action payloads — a breaking change to a queued action's schema must
  handle **in-flight queued items** (version the payload or accept both shapes during transition).
- Keep the discriminated result shape (`{ ok } | { ok:false, error }`) consistent across actions.
- Webhook/route-handler contracts changing require signature/version awareness for external callers.

## 3. Implementation guidance
- Version queued-action payloads (`v: number`) so the sync handler can migrate old items.
- Add-then-migrate: introduce the new field/shape, move callers, then remove the old.

## 4. Failure modes to avoid
- Renaming an action field and breaking a client form or a queued offline write silently.
- Tightening Zod validation that rejects items already sitting in the offline queue.

## 5. Definition of completion
Complete when the contract change is additive or all callers + queued-payload handling are updated,
the result shape stays consistent, and any significant change has an ADR.

## 6. Escalation / decision-log
Breaking a widely-used action contract or changing the standard result envelope REQUIRES an ADR.
