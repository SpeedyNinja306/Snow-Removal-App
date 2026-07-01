---
title: nextjs-app-structure
category: technical
appliesTo:
  - routing
  - project-structure
files:
  - "app/**"
  - "src/app/**"
  - "next.config.*"
tasks:
  - scaffold routes/segments
  - organize feature folders
inclusion: auto
priority: high
dependsOn:
  - foundation/architecture-principles.md
  - technical/server-client-boundaries.md
governs:
  - App Router layout, route groups, and feature folder organization
nonGoverns:
  - server/client rules (see technical/server-client-boundaries.md)
  - data access (see technical/database-prisma-postgres.md)
---

# Next.js App Structure

## 1. Intent
One predictable structure so feature agents work in isolation and code composes.

## 2. Hard rules
- **App Router only.** Organize by **route groups** reflecting the three surfaces:
  - `app/(field)/**` — field agent mobile surface (per `field-agent-mobile-flow.md`).
  - `app/(admin)/**` — dispatch/admin surface (per `dispatch-scheduling.md`).
  - `app/(owner)/**` — owner oversight (per `dashboard-reporting.md`); may nest within admin.
  - `app/(auth)/**` — login/session screens.
- **Feature colocation:** route segment holds its `page.tsx`, local components, and imports
  shared logic from `lib/<feature>` and shared server actions from `app/**/actions.ts` or
  `lib/<feature>/actions.ts`.
- **Shared, non-route code lives in `lib/`** (domain logic, zod schemas, authz, audit, invoicing,
  time, geo). UI primitives in `components/ui` (shadcn), shared components in `components/`.
- **Route Handlers** (`app/api/**/route.ts`) only for uploads/webhooks/integrations, not for
  ordinary form mutations (those are Server Actions).
- Each surface has its own `layout.tsx` enforcing the required role (server-side) before render.

## 3. Implementation guidance
- Keep pages as thin server components that compose feature components + actions.
- Name segments by domain noun (`jobs`, `invoices`, `customers`, `trucks`, `dispatch`).
- Put Prisma access behind `lib/db` + feature repositories, never inline in components.

## 4. Failure modes to avoid
- Mixing field and admin surfaces in one route tree.
- Business logic in `page.tsx`/components instead of `lib/`.
- Using Route Handlers as the default mutation path.

## 5. Definition of completion
Complete when new features slot into the correct route group, keep logic in `lib/`, gate the
surface by role in the layout, and follow the naming conventions.

## 6. Escalation / decision-log
Restructuring route groups or adopting a `src/` vs root `app/` convention differently than above
REQUIRES a decision-log entry.
