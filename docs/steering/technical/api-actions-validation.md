---
title: api-actions-validation
category: technical
appliesTo:
  - server-actions
  - route-handlers
  - validation
files:
  - "**/actions.ts"
  - "**/actions/**"
  - "app/api/**"
  - "**/lib/**/schemas.ts"
tasks:
  - write a server action
  - add input validation
  - build a route handler
inclusion: auto
priority: critical
dependsOn:
  - foundation/architecture-principles.md
  - domain/auth-roles.md
  - technical/server-client-boundaries.md
governs:
  - the shape/contract of mutations, validation, and error handling
nonGoverns:
  - business rules per feature (see domain docs)
  - DB modeling (see technical/database-prisma-postgres.md)
---

# API, Actions & Validation

## 1. Intent
A uniform, safe contract for every mutation so all agents write actions the same way.

## 2. Hard rules — the mutation checklist (every action/handler, in order)
1. **Authenticate**: resolve session; reject if none.
2. **Authorize**: check role + resource ownership (`auth-roles.md`) before any work.
3. **Validate**: parse input with a **Zod schema**; reject invalid input with field errors.
4. **Execute** business logic (delegating to `lib/<feature>`), inside a **transaction** if it
   touches multiple rows.
5. **Audit** if the event is auditable (`audit-logging.md`), in the same transaction.
6. **Return a typed result** and **`revalidate`** affected paths/tags.

## 3. Contract rules
- Server Actions are `"use server"` and return a **discriminated result**
  (`{ ok: true, data } | { ok: false, error, fieldErrors? }`) — do not throw raw errors to the
  client for expected failures.
- **Zod schemas are shared** between client form and server action (single source of truth) and
  live in `lib/<feature>/schemas.ts`.
- Route Handlers (uploads/webhooks) validate payloads + auth the same way; webhooks verify
  signatures.
- **Never trust client-sent** ids of resources the user shouldn't reach, totals, durations, roles,
  or timestamps for events (recompute/authorize server-side).
- Idempotency: destructive/financial actions (finalize invoice, record payment) must be safe
  against double-submit (guard by state + unique constraints).

## 4. Implementation guidance
- One action = one intent (`createJob`, `transitionJob`, `recordPayment`), not god actions.
- Centralize `getSession`, `requireRole`, `requireOwnerOfJob`, and result helpers; reuse everywhere.
- Return actionable messages; log server-side detail without leaking internals to the client.

## 5. Failure modes to avoid
- Actions that skip authz or validation "because the UI restricts it".
- Throwing raw errors / leaking stack traces to clients.
- Duplicating Zod shapes between client and server.
- Non-idempotent financial actions vulnerable to double clicks.

## 6. Definition of completion
Complete when every mutation follows the auth→authz→validate→execute→audit→revalidate checklist,
uses shared Zod schemas, returns typed results, and financial/destructive actions are idempotent —
with a test for the unauthorized/invalid paths.

## 7. Escalation / decision-log
Adopting tRPC/GraphQL or a different validation library than Zod REQUIRES a decision-log entry.
