---
title: scheduled-jobs
category: technical
appliesTo:
  - cron
  - scheduled-tasks
  - vercel-cron
files:
  - "vercel.json"
  - "app/api/cron/**"
tasks:
  - add a scheduled background job
  - configure Vercel Cron
inclusion: auto
priority: high
dependsOn:
  - technical/env-secrets-config.md
  - technical/api-actions-validation.md
governs:
  - Vercel Cron configuration and CRON_SECRET-protected cron route handlers
nonGoverns:
  - what each scheduled job does (see the relevant domain rule)
---

# Scheduled Jobs (Vercel Cron)

> Operational rule mirror: `.cursor/rules/technical-scheduled-jobs.mdc`.

## 1. Intent
Run infrequent server-side maintenance tasks (e.g. location ping purge) on Vercel without a
separate worker. All cron routes are **secret-protected** and **idempotent**.

## 2. Hard rules
- **Scheduler = Vercel Cron** (ADR-016). Config lives in root `vercel.json` `crons` array.
- Every cron Route Handler lives under `app/api/cron/<job-name>/route.ts`.
- **Every cron request MUST be authenticated** via `CRON_SECRET`:
  - Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron invocations.
  - Handler rejects requests missing or mismatching the secret (401, no body leak).
  - `CRON_SECRET` is server-only (see `env-secrets-config.md`); never client-exposed.
- Cron handlers are **GET-only**, **idempotent**, and safe to retry (Vercel may retry on failure).
- Cron handlers **do not use session auth** — they use `CRON_SECRET` only.
- Log start/result counts server-side; do not return sensitive data in the response body.
- Individual cron jobs document their domain behavior in the relevant domain rule (e.g. location
  ping purge → `domain/location-tracking.md`).

## 3. MVP cron jobs
| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/purge-location-pings` | `0 3 * * *` (daily 03:00 UTC) | Delete location pings older than 30 days (ADR-004/016) |

## 4. Implementation guidance
- Purge logic lives in `lib/<feature>/purge.ts` (pure, testable); the route handler calls it.
- Use a transaction or batched deletes for large purges; return `{ ok: true, deletedCount }`.
- In local dev, invoke manually: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/purge-location-pings`

## 5. Failure modes to avoid
- Cron routes without secret verification (public purge endpoints).
- Non-idempotent cron jobs that double-delete or corrupt data on retry.
- Putting business logic inline in the route handler instead of `lib/`.

## 6. Definition of completion
Complete when `vercel.json` declares the cron schedule, the route verifies `CRON_SECRET`, purge
logic is idempotent + tested, and the domain rule cross-references this doc.

## 7. Escalation / decision-log
Adding a new cron job or changing the scheduler platform REQUIRES a decision-log entry.
