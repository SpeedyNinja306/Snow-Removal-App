---
title: definition-of-done
category: process
appliesTo:
  - completion-criteria
  - quality-gate
files: []
tasks:
  - finish any feature/task
inclusion: agent-requested
priority: critical
dependsOn:
  - foundation/code-quality.md
  - technical/testing-strategy.md
  - domain/audit-logging.md
governs:
  - the universal bar a change must clear before it's called "done"
nonGoverns:
  - feature-specific completion (each domain doc has its own "Definition of completion")
---

# Definition of Done

## 1. Intent
One honest, shared bar for "done" so no agent declares partial work complete.

## 2. The gate — a change is DONE only when ALL apply:
- [ ] **Scope**: does exactly what the task asked; no unrequested scope creep.
- [ ] **Foundation**: respects product-goal, non-goals, architecture-principles, code-quality.
- [ ] **Feature rules**: satisfies the "Definition of completion" of each routed domain doc.
- [ ] **Security**: session + role + row-scope enforced server-side; unauthorized path tested.
- [ ] **Validation**: all inputs Zod-validated; invalid input returns field errors.
- [ ] **Data**: schema change (if any) followed `schema-change-policy.md`; migration + seed updated.
- [ ] **Audit**: required events audited transactionally (`audit-logging.md`).
- [ ] **Tests**: authz, state, money, validation, audit + negative cases pass; critical flow has E2E.
- [ ] **Types/lint**: typecheck + lint clean; no dead code; no stray `any`/TODO without a ref.
- [ ] **Config**: `.env.example` updated for any new var; no secrets committed/client-exposed.
- [ ] **Honesty**: no stubs/mocks presented as complete; MVP limits stated; nothing overclaimed
      (offline/GPS/telematics).
- [ ] **Decisions**: any ambiguity/architectural choice recorded as an ADR; affected docs updated.

## 3. Hard rules
- If any box is unchecked, the change is **not done** — say so explicitly and list what remains.
- "Works on my screen" is not done without tests + authz + honesty checks.

## 4. Failure modes to avoid
- Declaring done with failing/absent negative tests.
- Hiding stubbed behavior behind a happy-path demo.

## 5. Definition of completion
This doc is satisfied when every checkbox is truthfully checked, or the unchecked items are clearly
reported as remaining work.
