---
title: feature-build-checklist
category: process
appliesTo:
  - feature-development
files: []
tasks:
  - build a full feature slice
inclusion: agent-requested
priority: high
dependsOn:
  - process/task-intake.md
  - process/definition-of-done.md
  - technical/api-actions-validation.md
governs:
  - the end-to-end order of operations for building a feature slice
nonGoverns:
  - the completion bar (see process/definition-of-done.md)
---

# Feature Build Checklist

> Pull in when implementing a full vertical slice of a feature.

## 1. Intent
A repeatable order so features are built consistently, safely, and testably.

## 2. The checklist (in order)
1. **Intake** — classify + load routed docs (`task-intake.md`).
2. **Model** — schema changes via `schema-change-policy.md` + `database-prisma-postgres.md`
   (enums match canonical sets; FKs/indexes; migration).
3. **Contracts** — define shared Zod schemas + typed action result shapes
   (`api-actions-validation.md`).
4. **Server logic** — implement `lib/<feature>` (pure, testable) + server actions following the
   auth→authz→validate→execute→audit→revalidate checklist.
5. **Authorization** — enforce role + row scoping server-side (`auth-roles.md`); add audit
   (`audit-logging.md`) where required.
6. **UI** — build in the correct route group (`nextjs-app-structure.md`), server-first with small
   client islands; mobile-first for field (`field-agent-mobile-flow.md`).
7. **Offline** (if field write) — extend the supported queue set only if authorized
   (`pwa-offline-behavior.md`).
8. **Tests** — authz, state, money, validation, audit, negative cases (`testing-strategy.md`).
9. **Docs/decisions** — update `.env.example`, add ADRs for any decisions, update steering docs if
   reality changed.
10. **Self-review** — run `definition-of-done.md`; report honestly what works and what's stubbed.

## 3. Hard rules
- Don't skip the model→contract→server→authz→UI order (UI-first invites insecure/incorrect flows).
- Don't mark done anything that's stubbed (`AGENTS.md` no-fake-completion rule).

## 4. Failure modes to avoid
- Building UI before the server contract exists.
- Forgetting authz/audit/tests because "it works in the UI".

## 5. Definition of completion
The feature slice passes `definition-of-done.md`, all routed rules are satisfied, and decisions are
logged.
