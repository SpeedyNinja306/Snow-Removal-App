---
title: performance
category: technical
appliesTo:
  - performance
  - mobile-perf
files:
  - "app/**"
  - "components/**"
  - "**/lib/db/**"
tasks:
  - optimize a slow page/query
  - reduce client bundle
inclusion: agent-requested
priority: medium
dependsOn:
  - technical/server-client-boundaries.md
  - technical/database-prisma-postgres.md
governs:
  - performance expectations, especially on the field mobile surface
nonGoverns:
  - correctness/business rules (see domain docs)
---

# Performance

> `inclusion: agent-requested` — pull in for perf-focused tasks; baseline habits are covered by
> the always-on architecture/code-quality docs.

## 1. Intent
Keep the app fast where it matters most: the **field surface on a mid-range phone over poor
cellular**, and the dispatch board over realistic data volumes.

## 2. Hard rules / targets
- **Field surface: minimal client JS.** Only interactive islands are client components; the job
  list/detail render server-side. Target a fast, usable first load on 3G-class connections.
- **No N+1 queries.** Use Prisma `include`/`select` deliberately; index common filters
  (`database-prisma-postgres.md`).
- **Paginate/limit** all list queries (jobs, invoices, audit, pings). Never load unbounded sets.
- **Images are downscaled** (thumbnails for lists, lazy-load full — see `file-upload-strategy.md`).
- **Cache/`revalidate` deliberately**; avoid over-fetching on every navigation.
- Maps and charts load only on the surfaces that need them (code-split).

## 3. Implementation guidance
- Measure before optimizing; note the query/render being fixed.
- Prefer server-side aggregation for dashboards over shipping rows to the client.
- Select only needed columns; avoid returning full entities to the client.

## 4. Failure modes to avoid
- Shipping large libs (maps/charts) to the field surface.
- Unpaginated dispatch/audit queries.
- Loading full-resolution photos in list views.

## 5. Definition of completion
A perf change is complete when the targeted page/query has a measured improvement, lists are
paginated + indexed, the field surface stays light, and no correctness rule was traded away.

## 6. Escalation / decision-log
Adding a caching layer (Redis), edge runtime, or CDN strategy REQUIRES a decision-log entry.
