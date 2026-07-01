# Loading Strategy & Task Routing Matrix

## 1. The core idea: never load the whole brain
An agent should see **the 5 always-on foundation rules + only the rules its task needs**. Operational
rules live in `.cursor/rules/*.mdc`; each maps 1:1 to a detailed doc under `docs/steering/`.

### How Cursor loads rules (by `.mdc` frontmatter)
- `alwaysApply: true` → always injected (globs/description ignored). **Only the 5 foundation rules.**
- `alwaysApply: false` + `globs` → auto-attaches when matching files are opened/edited (**[glob]**).
- `alwaysApply: false` + `description`, no globs → agent pulls it in when the description matches the task (**[req]**).
- `alwaysApply: false` + no description + no globs → manual `@`-mention only. (We use none of these.)

### Rules of thumb
- **Global = only the 5 foundation rules.** Resist promoting anything else to always-on.
- **[glob] rules** attach automatically as you touch code areas — the primary selective mechanism.
- **[req] rules** are pulled deliberately by matching their description to your task.
- If unsure, **under-load then expand**, rather than bulk-loading.

## 2. Which rules are which
- **Always-on (5):** `foundation-product-goal`, `foundation-non-goals`, `foundation-architecture-principles`, `foundation-code-quality`, `foundation-decision-log-policy`.
- **[glob] (auto):** all `domain-*` except `domain-notifications`; `technical-nextjs-app-structure`, `technical-server-client-boundaries`, `technical-database-prisma-postgres`, `technical-api-actions-validation`, `technical-file-upload-strategy`, `technical-pwa-offline-behavior`, `technical-maps-location-stack`, `technical-env-secrets-config`, `technical-testing-strategy`, `technical-local-database-setup`, `technical-scheduled-jobs`; `process-schema-change-policy`.
- **[req] (agent-requested):** `foundation-glossary`, `domain-notifications`, `technical-state-management`, `technical-performance`, `technical-accessibility`, `process-task-intake`, `process-feature-build-checklist`, `process-api-change-policy`, `process-ui-change-policy`, `process-definition-of-done`, `process-gap-reporting`.

## 3. Task Routing Matrix
Every row assumes the **5 always-on foundation rules** are already loaded. "Additionally required" =
load these `.cursor/rules/*.mdc`. "Do NOT load" = leave out unless a specific need arises.

| Task type | Additionally required rules | Do NOT load (unless needed) |
|---|---|---|
| **Build Prisma schema for jobs** | `technical-database-prisma-postgres`, `process-schema-change-policy`, `domain-jobs-lifecycle`, `domain-audit-logging` (+`domain-trucks-fleet` if truck FK) | field-mobile, maps/location, pwa-offline, dashboard, accessibility |
| **Build Prisma schema for invoices & payments** | `technical-database-prisma-postgres`, `process-schema-change-policy`, `domain-invoices-billing`, `domain-payments`, `domain-audit-logging` | field-mobile, maps/location, pwa-offline, dashboard, trucks |
| **Implement field agent job detail screen** | `domain-field-agent-mobile-flow`, `domain-jobs-lifecycle`, `technical-nextjs-app-structure`, `technical-server-client-boundaries`, `domain-job-notes-photos`, `domain-time-tracking`, `technical-pwa-offline-behavior`, `technical-accessibility` | database internals, schema-change, dashboard, trucks, dispatch |
| **Implement invoice payment recording** | `domain-payments`, `domain-invoices-billing`, `domain-audit-logging`, `technical-api-actions-validation`, `domain-auth-roles`, `technical-testing-strategy` | maps/location, pwa-offline, trucks, dashboard, accessibility |
| **Build GPS/location tracking dashboard** | `domain-dashboard-reporting`, `domain-location-tracking`, `technical-maps-location-stack`, `domain-auth-roles`, `technical-server-client-boundaries` | invoices, payments, schema-change, time-tracking, trucks, offline |
| **Implement location ping purge (cron)** | `technical-scheduled-jobs`, `domain-location-tracking`, `technical-env-secrets-config`, `technical-api-actions-validation` | invoices, payments, field-mobile, dashboard |
| **Add photo uploads** | `domain-job-notes-photos`, `technical-file-upload-strategy`, `technical-server-client-boundaries`, `technical-env-secrets-config`, `domain-auth-roles` | invoices, payments, maps/location, dashboard, dispatch |
| **Change job lifecycle (status/transition)** | `domain-jobs-lifecycle`, `domain-audit-logging`, `process-schema-change-policy`, `technical-database-prisma-postgres`, `technical-api-actions-validation`, `process-api-change-policy` | maps/location, dashboard, trucks, file-upload, accessibility |
| **Add truck assignment to dispatch board** | `domain-trucks-fleet`, `domain-dispatch-scheduling`, `domain-jobs-lifecycle`, `domain-auth-roles`, `technical-api-actions-validation` | invoices, payments, file-upload, offline |
| **Implement auth/login & role gating** | `domain-auth-roles`, `technical-api-actions-validation`, `technical-server-client-boundaries`, `domain-audit-logging`, `technical-env-secrets-config` | invoices, maps, trucks, dashboard, offline, time-tracking |
| **Build dispatch board (schedule/assign)** | `domain-dispatch-scheduling`, `domain-jobs-lifecycle`, `domain-auth-roles`, `domain-location-tracking` (freshness), `technical-nextjs-app-structure`, `technical-server-client-boundaries` | file-upload, payments internals, schema-change, accessibility |
| **Owner reporting dashboard** | `domain-dashboard-reporting`, `domain-invoices-billing`, `domain-payments`, `domain-jobs-lifecycle`, `domain-auth-roles` | file-upload, maps (unless map view), offline, trucks |
| **Implement offline queue / PWA** | `technical-pwa-offline-behavior`, `domain-field-agent-mobile-flow`, `technical-api-actions-validation`, `process-api-change-policy`, `technical-server-client-boundaries` | dashboard, dispatch, trucks, payments internals |
| **Customer & service location CRUD** | `domain-customers-service-locations`, `technical-maps-location-stack` (geocoding), `technical-api-actions-validation`, `domain-auth-roles` | payments, offline, dashboard, trucks |
| **Time tracking on jobs** | `domain-time-tracking`, `domain-jobs-lifecycle`, `domain-field-agent-mobile-flow`, `technical-pwa-offline-behavior`, `domain-audit-logging` | maps, dashboard, trucks, file-upload, payments |
| **Set up / run local database** | `technical-local-database-setup`, `technical-database-prisma-postgres`, `technical-env-secrets-config` | all domain feature rules |
| **Write tests / QA a feature** | `technical-testing-strategy`, `process-definition-of-done`, + the domain rule(s) under test | unrelated feature rules |
| **Add an env var / configure a service** | `technical-env-secrets-config` (+ the feature rule needing it) | most domain rules |
| **Cross-cutting architecture change** | `process-schema-change-policy`, `process-api-change-policy`, + affected rules | — (rare case where broad reading is justified) |

> If a task isn't listed, pick the nearest row, load conservatively, and note the deviation
> (`process-task-intake`). Always finish with `process-definition-of-done` + `process-gap-reporting`.

## 4. Selective vs global recommendation (explicit)
- **Globally attach (`alwaysApply: true`):** the 5 foundation rules only.
- **Selectively attach ([glob]):** everything tied to a code area — schema, actions, feature folders,
  uploads, maps, offline, env, tests, local DB. This is where most context comes from.
- **Pull on demand ([req]):** reference/cross-cutting rules (glossary, state-management, performance,
  accessibility, notifications) and process rules when doing that process.
- **Never:** load unrelated feature rules "just in case." Empty context is cheaper than wrong context.
