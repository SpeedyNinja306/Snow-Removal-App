---
title: env-secrets-config
category: technical
appliesTo:
  - configuration
  - secrets
  - environment
files:
  - ".env*"
  - "**/env.*"
  - "**/config/**"
  - "next.config.*"
tasks:
  - add an env var
  - configure a service/secret
inclusion: auto
priority: high
dependsOn:
  - foundation/architecture-principles.md
governs:
  - environment variables, secret handling, and config validation
nonGoverns:
  - deployment targets/pipeline (see process/* and technical below)
---

# Env, Secrets & Config

## 1. Intent
One safe, validated way to configure the app across environments, with zero secret leakage.

## 2. Hard rules
- **Secrets live only in env vars**, never in code, never committed. Provide a committed
  **`.env.example`** documenting every variable (no real values).
- **Only `NEXT_PUBLIC_*` vars reach the client.** Everything else is server-only. Never expose DB
  URLs, storage credentials, or auth secrets to the client.
- **Validate env at startup** with a Zod schema in `lib/env` (fail fast if required vars are
  missing/malformed). Import config from `lib/env`, never `process.env` scattered in code.
- Distinct config per environment (local/dev/staging/prod); no prod secrets in dev.
- Rotate-able: no secret hardcoded such that rotation requires a code change.

## 3. Expected variables (current, per ADRs)
- `DATABASE_URL` + `DIRECT_URL` — Postgres (local docker dev; Neon pooled+direct prod).
- `AUTH_SECRET`, `AUTH_URL`/`NEXTAUTH_URL`, `AUTH_SESSION_MAX_AGE_SECONDS` (ADR-015, default 43200 = 12h).
- `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` — first OWNER bootstrap.
- R2 object storage: `R2_ENDPOINT`, `R2_REGION`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- MapTiler: `NEXT_PUBLIC_MAPTILER_KEY` (client), `MAPTILER_API_KEY` (server geocoding).
- `DEFAULT_TAX_RATE_BPS` — flat invoice tax rate (ADR-011).
- `CRON_SECRET` — Vercel Cron auth (ADR-016).
- `APP_URL` / base URL.

## 4. Implementation guidance
- `lib/env.ts` parses+exports a typed, validated config object; the rest of the app imports it.
- Keep `.env.example` in sync whenever a variable is added (part of definition of done).

## 5. Failure modes to avoid
- Committing a real `.env`.
- Reading `process.env` directly around the codebase (unvalidated, untyped).
- Leaking server secrets via `NEXT_PUBLIC_*` or into client bundles.

## 6. Definition of completion
Complete when all config flows through a validated `lib/env`, `.env.example` documents every var,
no secrets are committed or client-exposed, and startup fails fast on missing config.

## 7. Escalation / decision-log
Adding a new external service/secret or a secrets manager REQUIRES a decision-log entry.
