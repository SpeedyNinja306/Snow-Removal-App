---
title: schema-change-policy
category: process
appliesTo:
  - migrations
  - schema-governance
files:
  - "prisma/**"
  - "**/schema.prisma"
  - "**/migrations/**"
tasks:
  - change the database schema
  - add/alter a model or column
inclusion: auto
priority: critical
dependsOn:
  - technical/database-prisma-postgres.md
  - foundation/decision-log-policy.md
governs:
  - how schema changes are classified, migrated, and backfilled safely
nonGoverns:
  - modeling conventions (see technical/database-prisma-postgres.md)
---

# Schema Change Policy

## 1. Intent
Prevent data loss and drift when the schema evolves under many agents.

## 2. Change classification
- **Additive (safe)**: new nullable column, new table, new index, new enum value (appended).
  → Migrate normally; still reviewed.
- **Breaking (guarded)**: drop/rename column or table, change type, make a column NOT NULL,
  remove/reorder enum values, change a relation/onDelete.
  → **Requires a decision-log entry (ADR)** + a migration plan (expand → backfill → contract).

## 3. Hard rules
- All changes ship as **committed Prisma migration files**; never `db push` on shared/prod, never
  hand-edit an applied migration.
- **Breaking changes use expand-and-contract**: add new shape, backfill data, switch reads/writes,
  then remove old shape in a later migration — not all at once on live data.
- **Backfills are explicit and idempotent** (a script/migration), never assumed.
- Adding an enum value that affects a state machine (job status, invoice state) also requires
  updating the corresponding domain doc + transition rules in the **same change**.
- Money columns stay integer/cents; changing to Decimal is a breaking change + ADR.
- Every schema change updates the seed script and any affected Zod schemas/types.

## 4. Implementation guidance
- Name migrations descriptively (`add_job_truck_fk`, `invoice_number_backfill`).
- For NOT NULL on existing tables: add nullable → backfill → set NOT NULL in steps.
- Verify the migration on a copy of representative data before shared environments.

## 5. Failure modes to avoid
- Destructive single-step migrations on populated tables.
- Enum/state changes without updating the state machine + domain doc.
- `db push` divergence between environments.
- Silent, non-idempotent backfills.

## 6. Definition of completion
Complete when the change is classified, has a reviewed migration (expand/backfill/contract if
breaking), updates seed + schemas + affected domain docs, and (if breaking) has an ADR.

## 7. Escalation / decision-log
Every breaking change REQUIRES an ADR before it merges.
