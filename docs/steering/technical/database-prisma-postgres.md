---
title: database-prisma-postgres
category: technical
appliesTo:
  - database
  - prisma
  - schema
files:
  - "prisma/**"
  - "**/schema.prisma"
  - "**/lib/db/**"
  - "**/migrations/**"
tasks:
  - build Prisma schema
  - add a model/relation
  - write a query/repository
inclusion: auto
priority: critical
dependsOn:
  - foundation/architecture-principles.md
  - process/schema-change-policy.md
  - domain/jobs-lifecycle.md
governs:
  - Prisma/Postgres modeling, relational integrity, and migration discipline
nonGoverns:
  - feature-specific field semantics (see the relevant domain doc)
  - schema change process/approval (see process/schema-change-policy.md)
---

# Database — Prisma & Postgres

## 1. Intent
A clean, relationally-sound Postgres schema via Prisma that is the single source of truth for
data shape, with disciplined migrations.

## 2. Hard rules — relational integrity
- **Prisma is the only data-access layer.** No raw SQL except vetted, parameterized cases (log a
  decision); never string-concatenate SQL.
- **Every relationship has an explicit FK with a defined `onDelete`.** Default to `Restrict` for
  operational history (jobs, invoices, payments, users) — **prefer soft-delete/deactivate over
  cascade** so history is preserved (see domain docs). Use `Cascade` only for truly owned children
  (e.g. invoice line items under an invoice) and justify it.
- **Money as integers** (cents) — Prisma `Int`/`BigInt`, never `Float`/`Decimal` for currency in
  MVP unless a decision-log entry chooses `Decimal`.
- **Timestamps** `createdAt @default(now())` and `updatedAt @updatedAt` on mutable entities;
  domain lifecycle timestamps per `jobs-lifecycle.md` are explicit columns.
- **Enums in Prisma** mirror the canonical sets exactly (job status, invoice state, payment
  method, note type, role).
- **Indexes** on all FKs and on common query filters (job status, scheduledAt, agentId,
  customerId, invoice state, capturedAt for pings).
- **No hard deletes** of entities referenced by history — use `active`/`deletedAt` soft flags.
- All writes that span multiple rows/tables use **transactions** (`prisma.$transaction`).

## 3. Migration discipline
- Schema changes go through **Prisma Migrate** with committed, reviewed migration files — never
  `db push` against shared/prod, never hand-edit applied migrations.
- Follow `process/schema-change-policy.md` for additive-vs-breaking classification and backfills.
- Migrations must be **forward-only and reversible-in-practice** (a documented down path or a new
  corrective migration).

## 4. Implementation guidance
- Keep queries in `lib/<feature>` repositories returning typed results; keep field-agent row
  scoping in the query (`where: { agentId: session.userId }`).
- Seed script for local dev with representative data (owner, dispatcher, agents, sample jobs).

## 5. Failure modes to avoid
- Cascade deletes that erase operational/financial history.
- Float money columns.
- Missing FK indexes causing slow dispatch/board queries.
- Bypassing migrations with `db push` on shared environments.

## 6. Definition of completion
Complete when models have explicit FKs + sensible `onDelete`, money is integer, enums match
canonical sets, key columns are indexed, multi-row writes are transactional, and the change ships
as a reviewed migration per policy.

## 7. Escalation / decision-log
Choosing `Decimal` for money, adding raw SQL, denormalizing for performance, or adding a second
datastore (cache/queue) REQUIRES a decision-log entry.
