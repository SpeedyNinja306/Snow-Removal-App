---
title: local-database-setup
category: technical
appliesTo:
  - local-dev
  - database-setup
files:
  - docker-compose.yml
  - prisma/seed.*
tasks:
  - start the local database
  - run migrations and seed
inclusion: agent-requested
priority: high
dependsOn:
  - technical/database-prisma-postgres.md
  - technical/env-secrets-config.md
  - process/schema-change-policy.md
governs:
  - how to run Postgres, migrations, and seed data for local development
nonGoverns:
  - schema modeling (see technical/database-prisma-postgres.md)
  - migration classification/process (see process/schema-change-policy.md)
---

# Local Database Setup

> Operational rule mirror: `.cursor/rules/technical-local-database-setup.mdc`.

## 1. Intent
Give any agent a working Postgres from line one. **Local dev = docker Postgres**; **production =
Neon serverless Postgres** (ADR-013). Never commit a real `.env`.

## 2. First-time setup
1. Copy env: `cp .env.example .env.local` (or `.env`) and fill in secrets (`AUTH_SECRET`,
   `SEED_OWNER_EMAIL`/`SEED_OWNER_PASSWORD`, and provider keys as needed). The local
   `DATABASE_URL`/`DIRECT_URL` defaults already match `docker-compose.yml`.
2. Start Postgres: `docker compose up -d` (image `postgres:16-alpine`, port `5432`, named volume
   `sr_app_pgdata`, healthcheck via `pg_isready`).
3. Apply migrations: `npx prisma migrate dev` (uses `DIRECT_URL`).
4. Seed data: `npx prisma db seed` — creates the first `OWNER` from `SEED_OWNER_*` (idempotent) plus
   representative dev data (dispatcher, agents, sample customers/jobs).
5. Run the app: `npm run dev`.

## 3. Common commands
- `docker compose down` — stop, keep data. `docker compose down -v` — stop and delete data.
- `npx prisma studio` — inspect data. `npx prisma migrate reset` — drop + re-migrate + reseed (local only).

## 4. Hard rules
- **Never `prisma db push`** against shared/prod — migrations only (see `schema-change-policy.md`).
- Local default credentials are **dev-only**; production secrets live in the deploy platform, not here.
- The **seed script is idempotent** (no-op if a user already exists) so re-runs are safe.
- `DATABASE_URL` = pooled (runtime), `DIRECT_URL` = direct (migrations). Locally both point at docker.

## 5. Failure modes to avoid
- Committing a real `.env`.
- Using `db push` and diverging from committed migrations.
- A non-idempotent seed that duplicates the OWNER on re-run.

## 6. Definition of completion
Complete when a fresh clone can, following section 2, reach a running app backed by a migrated +
seeded local Postgres, with no secrets committed.
