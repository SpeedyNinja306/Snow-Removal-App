---
title: ui-change-policy
category: process
appliesTo:
  - ui-consistency
files:
  - "app/**"
  - "components/**"
tasks:
  - change shared UI
  - alter a field/admin screen layout
inclusion: agent-requested
priority: medium
dependsOn:
  - domain/field-agent-mobile-flow.md
  - technical/accessibility.md
governs:
  - keeping UI consistent across surfaces and safe for the field flow
nonGoverns:
  - business logic (see domain docs)
---

# UI Change Policy

## 1. Intent
Keep the three surfaces (field/admin/owner) consistent and avoid regressing the critical field flow.

## 2. Hard rules
- **Reuse shared components** (`components/ui` shadcn + shared `components/`); don't fork one-off
  variants of buttons/inputs/cards.
- **Field surface changes must preserve the ≤2-tap priority actions** and one-handed action bar
  (`field-agent-mobile-flow.md`). Do not bury status/notes/photo/time/invoice actions.
- **Accessibility baseline** applies to every UI change (`accessibility.md`): labels, contrast,
  touch targets, text-not-color state.
- **Don't mix surfaces**: field components stay mobile-first; admin density stays out of the field flow.
- Empty/loading/error states are required for any new data view, not afterthoughts.
- Status/state colors follow one shared mapping (job status, invoice state, location freshness) —
  don't invent per-screen color schemes.

## 3. Implementation guidance
- Extend shared components with props rather than duplicating them.
- Keep a single source for status→label→color mappings and reuse it.

## 4. Failure modes to avoid
- One-off button/input styles drifting the design.
- A "small UI tweak" pushing a field priority action out of thumb reach.
- New views with no empty/error state.

## 5. Definition of completion
Complete when the change reuses shared components, preserves field priority actions + a11y baseline,
provides empty/loading/error states, and uses the shared status color/label mapping.

## 6. Escalation / decision-log
Introducing a new design system, component library, or restyling shared primitives REQUIRES a
decision-log entry.
