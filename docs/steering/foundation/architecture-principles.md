---
title: architecture-principles
category: foundation
appliesTo:
  - all-features
  - system-design
files:
  - "**/*"
tasks:
  - any task that adds or changes code structure
inclusion: always
priority: critical
dependsOn:
  - foundation/product-goal.md
governs:
  - the locked technology stack and top-level architecture rules
  - server-first, trust-boundary, and data-ownership principles
nonGoverns:
  - detailed per-layer rules (see technical/*)
  - feature business rules (see domain/*)
---

# Architecture Principles

## 1. Intent
Give every agent the same non-negotiable architectural frame so independently built features
compose into one coherent app.

## 2. Hard rules — Locked stack (do not swap without a decision-log entry)
- **Framework:** Next.js **App Router** + **TypeScript (strict)**, React Server Components first.
- **Data:** **PostgreSQL** via **Prisma**. Prisma is the only DB access layer.
- **Auth:** **Auth.js** session-based auth. Roles: `OWNER`, `DISPATCH`, `FIELD_AGENT`.
- **Mutations:** **Server Actions** are the primary write path; Route Handlers only for
  webhooks, uploads, and non-form integrations.
- **Validation:** **Zod** at every trust boundary (all inputs to actions/handlers).
- **UI:** **Tailwind CSS + shadcn/ui**. Mobile-first.
- **Storage:** S3-compatible object storage via **presigned URLs** (no binaries through the app server).
- **Maps/Location:** **MapLibre GL** + browser **Geolocation API**.
- **Testing:** **Vitest + Testing Library** (unit/integration), **Playwright** (E2E).
- **PWA:** service worker with a narrow offline scope.

## 3. Cross-cutting principles
- **Server-first.** Do work on the server; ship the minimum to the client. Client components
  only for interactivity (maps, forms, camera, offline queue).
- **Trust boundary = server.** Every mutation re-validates input (Zod) and re-checks
  authorization server-side. The client is never trusted.
- **Job-centric data model.** The `Job` is the operational hub; model relationships around it.
- **Explicit over implicit.** No hidden magic; prefer readable, typed, boring code.
- **Selective context.** Code is organized by feature so agents can work in isolation.

## 4. Implementation guidance
- Colocate feature code under a predictable structure (see `technical/nextjs-app-structure.md`).
- Push shared logic into `lib/` modules, not into components.
- Keep server/client boundaries explicit (see `technical/server-client-boundaries.md`).

## 5. Failure modes to avoid
- Introducing a second data-access path or ORM.
- Doing authorization in the client or trusting client-sent role/ids.
- Turning Server Actions into a dumping ground with no validation.
- Swapping a locked technology silently.

## 6. Definition of completion
Code fits the architecture when it uses the locked stack, keeps mutations validated + authorized
server-side, and respects the server-first, job-centric model.

## 7. Escalation / decision-log
Any change to the locked stack, the mutation strategy, or the trust-boundary model REQUIRES a
decision-log entry.
