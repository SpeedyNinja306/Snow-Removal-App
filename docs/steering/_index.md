# Steering Index

Catalog of every SR-App rule. **Operational rules live in `.cursor/rules/*.mdc`** (what Cursor's
engine actually reads). Each `.mdc` has a detailed reference doc in this `docs/steering/` tree
(1:1). **The `.mdc` file is authoritative**; the `docs/steering/*.md` doc holds the longer-form
rationale. Do not load everything — use `_loading-strategy.md` (Task Routing Matrix).

**Mode legend (from `.mdc` frontmatter):**
- **[always]** `alwaysApply: true` — injected into every task (globs/description ignored).
- **[glob]** `alwaysApply: false` + `globs` — auto-attaches when matching files are opened/edited.
- **[req]** `alwaysApply: false` + `description`, no globs — agent reads the description and pulls it in when relevant.

---

## Foundation — always-on core (5 always + 1 requested)
| Rule (`.cursor/rules/…`) | Mode | Governs |
|---|---|---|
| `foundation-product-goal.mdc` | **[always]** | Purpose, three users, north star. |
| `foundation-non-goals.mdc` | **[always]** | Hard MVP scope guardrails. |
| `foundation-architecture-principles.mdc` | **[always]** | Locked stack + architecture rules. |
| `foundation-code-quality.mdc` | **[always]** | Baseline code/typing/comment standards. |
| `foundation-decision-log-policy.mdc` | **[always]** | When/how to record ADRs. |
| `foundation-glossary.mdc` | **[req]** | Canonical entity names & definitions. |

## Domain — feature/business rules
| Rule | Mode | Globs / trigger | Governs |
|---|---|---|---|
| `domain-auth-roles.mdc` | **[glob]** | `**/auth/**,**/middleware.ts,**/lib/auth/**,**/lib/authz/**` | 3 roles + server-side enforcement. |
| `domain-users-employee-profiles.mdc` | **[glob]** | `**/users/**,**/employees/**,**/profile/**` | User records, activation, thin profiles. |
| `domain-customers-service-locations.mdc` | **[glob]** | `**/customers/**,**/locations/**,**/service-locations/**` | Customers + geocoded locations. |
| `domain-jobs-lifecycle.mdc` | **[glob]** | `**/jobs/**,**/lib/jobs/**,**/actions/job*/**` | Job entity, statuses, transitions. |
| `domain-dispatch-scheduling.mdc` | **[glob]** | `**/dispatch/**,**/schedule/**,app/(admin)/**` | Assign/schedule + dispatch board. |
| `domain-field-agent-mobile-flow.mdc` | **[glob]** | `app/(field)/**,**/field/**,**/mobile/**` | Mobile field priority actions. |
| `domain-location-tracking.mdc` | **[glob]** | `**/location/**,**/tracking/**,**/lib/geo/**` | Coarse pings, freshness, consent. |
| `domain-trucks-fleet.mdc` | **[glob]** | `**/trucks/**,**/fleet/**` | Truck assignment; rejects telematics. |
| `domain-invoices-billing.mdc` | **[glob]** | `**/invoices/**,**/billing/**,**/lib/invoicing/**` | Invoice states, line items, tax, print. |
| `domain-payments.mdc` | **[glob]** | `**/payments/**,**/lib/payments/**` | Recording payments, partials, PAID. |
| `domain-time-tracking.mdc` | **[glob]** | `**/time/**,**/lib/time/**` | Labor timers/entries, auto-stop. |
| `domain-job-notes-photos.mdc` | **[glob]** | `**/notes/**,**/photos/**,**/media/**` | Notes + photo media, scoping. |
| `domain-dashboard-reporting.mdc` | **[glob]** | `**/dashboard/**,**/reports/**,app/(owner)/**` | Read-only oversight views. |
| `domain-audit-logging.mdc` | **[glob]** | `**/lib/audit/**,**/audit/**` | Required auditable events + metadata. |
| `domain-notifications.mdc` | **[req]** | — | In-app event notifications (thin). |

## Technical — stack & implementation rules
| Rule | Mode | Globs / trigger | Governs |
|---|---|---|---|
| `technical-nextjs-app-structure.mdc` | **[glob]** | `app/**,src/app/**,next.config.*` | Route groups + feature folders. |
| `technical-server-client-boundaries.mdc` | **[glob]** | `app/**,src/app/**,components/**,lib/**` | Server-first, trust boundary. |
| `technical-database-prisma-postgres.mdc` | **[glob]** | `prisma/**,**/schema.prisma,**/lib/db/**,**/migrations/**` | Prisma/Postgres modeling + integrity. |
| `technical-api-actions-validation.mdc` | **[glob]** | `**/actions.ts,**/actions/**,app/api/**,**/lib/**/schemas.ts` | Mutation checklist + Zod contracts. |
| `technical-file-upload-strategy.mdc` | **[glob]** | `**/upload/**,**/lib/storage/**,app/api/upload/**` | Presigned direct-to-R2 uploads. |
| `technical-pwa-offline-behavior.mdc` | **[glob]** | `**/service-worker*,**/sw.*,**/manifest.*,**/lib/offline/**` | Offline meaning + supported write set. |
| `technical-maps-location-stack.mdc` | **[glob]** | `**/map/**,**/maps/**,**/lib/geo/**` | MapLibre + MapTiler + Geolocation. |
| `technical-env-secrets-config.mdc` | **[glob]** | `.env*,**/env.*,**/config/**,next.config.*` | Env vars, secrets, validated config. |
| `technical-testing-strategy.mdc` | **[glob]** | `**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/e2e/**,**/tests/**` | Test tooling + what must be tested. |
| `technical-local-database-setup.mdc` | **[glob]** | `docker-compose.yml,prisma/seed.*` | Run local Postgres, migrations, seed. |
| `technical-scheduled-jobs.mdc` | **[glob]** | `app/api/cron/**,vercel.json` | Vercel Cron + CRON_SECRET-protected routes. |
| `technical-state-management.mdc` | **[req]** | — | Minimal server-first client state. |
| `technical-performance.mdc` | **[req]** | — | Perf targets, esp. field mobile. |
| `technical-accessibility.mdc` | **[req]** | — | A11y + field usability baseline. |

## Process — how-to-change workflows
| Rule | Mode | Globs / trigger | Governs |
|---|---|---|---|
| `process-schema-change-policy.mdc` | **[glob]** | `prisma/**,**/schema.prisma,**/migrations/**` | Additive vs breaking migrations. |
| `process-task-intake.mdc` | **[req]** | — | Start a task + load minimal context. |
| `process-feature-build-checklist.mdc` | **[req]** | — | End-to-end order for a feature slice. |
| `process-api-change-policy.mdc` | **[req]** | — | Changing action/handler contracts. |
| `process-ui-change-policy.mdc` | **[req]** | — | UI consistency + protecting field flow. |
| `process-definition-of-done.mdc` | **[req]** | — | Universal completion gate. |
| `process-gap-reporting.mdc` | **[req]** | — | Surfacing gaps/ambiguity/stubs. |

## Root docs (not rules)
| Doc | What it is |
|---|---|
| `AGENTS.md` | Master repo-level agent guidance (start here). |
| `docs/product-spec.md` | Concrete MVP spec. |
| `docs/decision-log.md` | Append-only ADR record (ADR-001…017). |
| `docs/steering/_loading-strategy.md` | Context-minimization + Task Routing Matrix. |

---

## "What do I open first?" quick starts
- **Any task** → the 5 always-on foundation rules auto-load; then consult `_loading-strategy.md`.
- **Schema work** → `technical-database-prisma-postgres` + `process-schema-change-policy` + relevant domain rule(s).
- **A field screen** → `domain-field-agent-mobile-flow` + the feature's domain rule + `technical-nextjs-app-structure` + `technical-server-client-boundaries`.
- **Money features** → `domain-invoices-billing` and/or `domain-payments` + `domain-audit-logging`.
- **GPS/maps** → `domain-location-tracking` + `technical-maps-location-stack`.
- **Location ping purge / cron** → `technical-scheduled-jobs` + `domain-location-tracking`.
- **Local DB / first run** → `technical-local-database-setup`.
- **Finishing up** → `process-definition-of-done` + `process-gap-reporting`.
