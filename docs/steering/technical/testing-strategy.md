---
title: testing-strategy
category: technical
appliesTo:
  - testing
  - qa
files:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/e2e/**"
  - "**/tests/**"
tasks:
  - write tests
  - set up test tooling
  - QA a feature
inclusion: auto
priority: high
dependsOn:
  - foundation/code-quality.md
  - process/definition-of-done.md
governs:
  - test tooling, what must be tested, and coverage expectations by layer
nonGoverns:
  - the definition-of-done checklist itself (see process/definition-of-done.md)
---

# Testing Strategy

## 1. Intent
Right-sized testing that protects the risky parts (money, auth, job state, offline sync) without
chasing coverage vanity.

## 2. Tooling
- **Vitest + Testing Library** — unit + integration (server actions, lib logic, components).
- **Playwright** — E2E for the critical field + admin flows.
- Test DB via a disposable Postgres (docker or ephemeral schema); never test against prod.

## 3. What MUST be tested (non-negotiable)
- **Authorization**: each role's allow/deny on protected actions; field-agent row scoping.
- **Job state machine**: legal transitions succeed, **illegal transitions are rejected**, timestamps
  set correctly (`jobs-lifecycle.md`).
- **Money math**: invoice totals, partial payments → PAID derivation, reversals (`invoices-billing.md`,
  `payments.md`). Integer/cents correctness.
- **Validation**: actions reject invalid input via Zod with field errors.
- **Offline queue**: queued writes sync, re-validate server-side, and surface conflicts/failures
  (`pwa-offline-behavior.md`).
- **Audit**: required events produce an audit record in the same transaction.

## 4. What is lighter-touch
- Pure presentational components: smoke/render tests only.
- Dashboards: assert aggregates reconcile with seeded data, not pixel layout.

## 5. Implementation guidance
- Co-locate unit tests with code; E2E under `e2e/`.
- Prefer testing server actions directly (fast) over UI for logic-heavy paths.
- Seed deterministic fixtures (owner, dispatcher, 2 agents, sample jobs/invoices).

## 6. Failure modes to avoid
- High coverage numbers with no tests on money/auth/state.
- Flaky E2E from real network/time; stub time, use test data.
- Testing only happy paths (must test denied/invalid/stale cases).

## 7. Definition of completion
A feature is test-complete when its authz, state transitions, money math (if any), validation, and
audit are covered including negative cases, and its critical user flow has an E2E path.

## 8. Escalation / decision-log
Changing test frameworks or adding a coverage gate threshold REQUIRES a decision-log entry.
