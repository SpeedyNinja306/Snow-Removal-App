# SR-App — Decision Log (ADRs)

Append-only record of architectural and product decisions. **Never edit or delete past entries** —
supersede them with a newer entry. Governed by `docs/steering/foundation/decision-log-policy.md`.

Add an entry whenever you: change the locked stack, bend a non-goal, add a dependency/service,
make a non-additive schema change, choose between materially different approaches, or resolve an
ambiguity by guessing.

**Entry format**
```
### ADR-<NNN>: <short title>
- Date: YYYY-MM-DD
- Status: proposed | accepted | superseded-by ADR-XXX
- Context: what forced a decision
- Decision: what we chose
- Alternatives: what we rejected and why
- Consequences: trade-offs, follow-ups, affected steering docs
```

---

## Initial decisions

### ADR-001: Adopt Next.js (App Router) + TypeScript as the app framework
- Date: 2026-06-30
- Status: accepted
- Context: Need one framework serving a mobile PWA field surface and desktop admin, with strong
  server-side rendering and a clean mutation model.
- Decision: Next.js App Router + TypeScript (strict), React Server Components first; Server Actions
  as the primary mutation path, Route Handlers only for uploads/webhooks.
- Alternatives: SPA + separate REST API (more moving parts, weaker SSR for field surface); Remix
  (viable, smaller ecosystem fit here).
- Consequences: Locks `foundation/architecture-principles.md`, `technical/nextjs-app-structure.md`,
  `technical/server-client-boundaries.md`, `technical/api-actions-validation.md`.

### ADR-002: PostgreSQL via Prisma as the sole data layer
- Date: 2026-06-30
- Status: accepted
- Context: Relational, integrity-heavy domain (jobs↔invoices↔payments↔customers) needs strong FKs
  and migrations.
- Decision: PostgreSQL + Prisma; Prisma is the only data-access layer; money stored as integer cents;
  soft-delete/deactivate over cascade for historical entities.
- Alternatives: Drizzle (fine, team familiarity with Prisma), a document DB (poor fit for relational integrity).
- Consequences: Governs `technical/database-prisma-postgres.md`, `process/schema-change-policy.md`.

### ADR-003: Three fixed roles (OWNER, DISPATCH, FIELD_AGENT) with server-side enforcement
- Date: 2026-06-30
- Status: accepted
- Context: Distinct field vs back-office vs oversight needs; must prevent field agents seeing others' data.
- Decision: Exactly three roles for MVP; authorization enforced server-side on every mutation +
  protected read; field agents row-scoped to their own jobs.
- Alternatives: Fine-grained permission matrix (overkill for MVP), client-side gating (insecure).
- Consequences: Governs `domain/auth-roles.md`; new roles require a superseding ADR.

### ADR-004: Location is coarse, consent-based, foreground-only pings — not continuous tracking
- Date: 2026-06-30
- Status: accepted
- Context: A PWA cannot reliably track in the background; overclaiming would be dishonest and fragile.
- Decision: Sample coarse location only while a field agent has an active job foregrounded and has
  granted permission; label freshness (fresh ≤2m / aging 2–10m / stale >10m); purge pings >30 days.
- Alternatives: Native wrapper for background GPS (out of MVP scope, non-goal), continuous tracking (impossible/misleading).
- Consequences: Governs `domain/location-tracking.md`, `technical/maps-location-stack.md`; reversal
  requires a superseding ADR that also revisits `foundation/non-goals.md`.

### ADR-005: Trucks are assignment-only; no telematics
- Date: 2026-06-30
- Status: accepted
- Context: Risk of scope creep into fleet management/diagnostics.
- Decision: Trucks are a lightweight entity assignable to agents/jobs; no engine/OBD/live-GPS/fake metrics.
- Alternatives: Full fleet management (non-goal for MVP).
- Consequences: Governs `domain/trucks-fleet.md`, reinforced by `foundation/non-goals.md`.

### ADR-006: We record payments; we are not a payment processor (MVP)
- Date: 2026-06-30
- Status: accepted
- Context: Full billing lifecycle needed without the compliance burden of card processing.
- Decision: Record payments (cash/check/external-card/e-transfer/other) with amount + reference;
  no card data stored; PAID derived from summed non-voided payments ≥ grand total.
- Alternatives: Integrate a gateway now (compliance + cost, not MVP-critical).
- Consequences: Governs `domain/payments.md`, `domain/invoices-billing.md`.

### ADR-007: Offline is a narrow, explicit write set (status, notes, photos, time) + read cache
- Date: 2026-06-30
- Status: accepted
- Context: Field connectivity is poor, but a full offline-first sync engine is out of scope.
- Decision: Cache assigned-job reads; queue only status transitions, notes, photo capture, and time
  start/stop; re-validate on sync; surface pending/conflict/failure — never silent loss.
- Alternatives: Offline-first CRDT (non-goal, heavy), online-only (unusable in the field).
- Consequences: Governs `technical/pwa-offline-behavior.md`, `domain/field-agent-mobile-flow.md`.

### ADR-008: Object storage is Cloudflare R2 (S3-compatible), private buckets, presigned URLs
- Date: 2026-06-30
- Status: accepted
- Context: `technical/file-upload-strategy.md` mandates direct-to-storage uploads via presigned URLs
  against S3-compatible storage; we must pick a concrete provider (resolves P-1).
- Decision: Use **Cloudflare R2** via the S3-compatible API. Private buckets only; uploads via
  server-minted presigned PUT URLs; reads via short-lived presigned GET URLs. Object keys are
  server-generated and job-namespaced (`jobs/<jobId>/<uuid>`). Credentials are server-only env vars.
- Alternatives: AWS S3 (egress cost for image-heavy field use); Supabase Storage (fine, but we are
  not otherwise adopting Supabase — see ADR-013 — so it adds a provider without offsetting savings).
- Consequences: Governs config in `technical/file-upload-strategy.md`, `technical/env-secrets-config.md`.
  R2 has no egress fees, easing thumbnail/media reads. A CDN or non-image types still require a new ADR.

### ADR-009: Map tiles + geocoding via MapTiler
- Date: 2026-06-30
- Status: accepted
- Context: `technical/maps-location-stack.md` requires MapLibre GL with a configurable tile/style +
  geocoding provider chosen via ADR (resolves P-2).
- Decision: Use **MapTiler** for both vector tiles/styles and geocoding. Tile/style key is a
  domain-restricted `NEXT_PUBLIC_MAPTILER_KEY` (public-safe by MapTiler design). **Geocoding runs
  server-side** (server-only usage) and results are **persisted** on service locations, never
  geocoded per render.
- Alternatives: Mapbox (higher cost, GL-JS license friction with MapLibre); OSM raster +
  Nominatim (public Nominatim usage policy forbids production geocoding load, no SLA).
- Consequences: Governs `technical/maps-location-stack.md`, `domain/customers-service-locations.md`,
  `technical/env-secrets-config.md`. Changing provider stays code-cheap because tiles/styles are env-configurable.

### ADR-010: Auth is Auth.js (NextAuth v5) Credentials + seeded first OWNER
- Date: 2026-06-30
- Status: accepted
- Context: `domain/auth-roles.md` needs a concrete auth mechanism, and with no public signup there
  must be a way to create the first `OWNER` (resolves P-3 and the bootstrap gap).
- Decision: Use **Auth.js (NextAuth) v5** with a **Credentials provider** (email + password).
  Passwords hashed with **argon2id**; sessions are secure, httpOnly, JWT-strategy cookies carrying
  the user id + role, with role re-fetched on sensitive operations. **No self-service signup**;
  users are created by DISPATCH/OWNER. The **first OWNER is created by a seed script** from
  `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` env vars, idempotent and no-op if any user exists.
- Alternatives: Email magic-link (poor in bad-signal field use, needs an email provider — a new
  external service/non-goal); external OAuth/SSO (overkill for a single-tenant internal tool).
- Consequences: Governs `domain/auth-roles.md`, `technical/env-secrets-config.md`. Adds `AUTH_SECRET`
  and seed vars. SSO / password-reset remain post-MVP (require a superseding ADR).

### ADR-011: Invoice tax is a single configurable flat rate, snapshotted at finalize
- Date: 2026-06-30
- Status: accepted
- Context: `domain/invoices-billing.md` leaves MVP tax handling open (resolves P-4).
- Decision: One **configurable flat tax rate** (basis points, integer) applied to the **taxable
  subtotal**. Taxable categories: `LABOR`, `PARTS`, `FEE`; `DISCOUNT` reduces the taxable base.
  The rate in effect is **snapshotted onto the invoice at `DRAFT → FINAL`** so later config changes
  never rewrite issued invoices. Default rate is configurable and may be `0` (degrades to no tax).
  All tax math is server-side in `lib/invoicing`, integer cents, documented rounding.
- Alternatives: No tax at all (unrealistic for a service business); per-line or jurisdictional tax
  engine (out of MVP scope; still requires an ADR per the doc's escalation clause).
- Consequences: Governs `domain/invoices-billing.md`; adds `DEFAULT_TAX_RATE_BPS` config. The actual
  numeric rate is an operational/config value for the owner, not a code change.

### ADR-012: One timer per agent — starting a timer auto-stops the previous
- Date: 2026-06-30
- Status: accepted
- Context: `domain/time-tracking.md` requires choosing block-new vs auto-stop for concurrent timers
  and logging it (resolves P-5).
- Decision: **Auto-stop** the agent's currently running time entry (set its `endedAt = now`) when a
  new timer starts, within one server transaction. Matches the field reality of working one job at
  a time and prevents forgotten runaway timers. The auto-stop is audited.
- Alternatives: Block starting a new timer until the old is stopped (adds friction and leaves stale
  timers running when an agent forgets — worse for the ≤2-tap field flow).
- Consequences: Governs `domain/time-tracking.md`. Offline start/stop still queues with real
  timestamps; sync applies the same auto-stop rule server-side.

### ADR-013: Hosting on Vercel with Neon serverless Postgres
- Date: 2026-06-30
- Status: accepted
- Context: Deploy target + managed Postgres were unresolved (resolves P-6).
- Decision: Deploy on **Vercel** (first-class Next.js App Router, Server Actions, edge/serverless)
  with **Neon** serverless Postgres. Prisma connects through **Neon's pooled connection string**
  (`DATABASE_URL` = pooled; `DIRECT_URL` = direct, for migrations) to survive serverless connection
  churn.
- Alternatives: Single long-lived Node host + managed Postgres (more ops, no clear MVP benefit);
  Supabase all-in-one (would re-open ADR-008/010 provider choices unnecessarily).
- Consequences: Governs `technical/env-secrets-config.md` (adds `DIRECT_URL`); confirms Prisma must
  use a pooled connection. Follow-up: verify Prisma pooling config before load testing.

### ADR-014: Overpayment is warn-and-allow (no refund workflow in MVP)
- Date: 2026-06-30
- Status: accepted
- Context: `domain/payments.md` leaves overpayment handling open (resolves P-7).
- Decision: **Warn-and-allow.** Record the full payment amount even if it pushes `amountPaid` above
  the grand total; the invoice becomes `PAID` once summed non-voided payments ≥ grand total, and the
  UI surfaces the **overpaid delta** as a flag. Mistakes are corrected via a reversing
  (negative/void) payment, per existing rules. **No refund/credit-balance workflow** in MVP.
- Alternatives: Hard-block payments exceeding the balance (fails real cash rounding/tips and split
  payments; blocks legitimate field workflows).
- Consequences: Governs `domain/payments.md`. Refunds, deposits, or credit balances require a new ADR.
  Overpayment events are explicitly audited (see `domain/audit-logging.md`).

### ADR-015: JWT session max age 12 hours; immediate revocation is required fast-follow
- Date: 2026-06-30
- Status: accepted
- Context: Auth.js v5 JWT sessions carry role in the token; deactivating a user or changing their
  role does not invalidate an existing token until expiry. Owner sign-off requested a short session
  window and a committed path to immediate revocation.
- Decision: Set **session/JWT max age to 12 hours** (`AUTH_SESSION_MAX_AGE_SECONDS=43200`), within
  the approved 8–24h window. Sessions must not be long-lived. **Immediate session invalidation on
  role change or user deactivation is NOT in MVP** but is a **required fast-follow** (not deferred
  indefinitely) — implement session version / token revocation so all sessions for a user are
  invalidated on role change or deactivation. **Interim mitigation until fast-follow ships:** re-fetch
  `active` + role from the DB on every sensitive mutation and deny if deactivated or role insufficient.
- Alternatives: Long-lived sessions (rejected — stale role/deactivation too risky); blocking MVP on
  full revocation infrastructure (rejected — fast-follow with interim mitigation is acceptable).
- Consequences: Governs `domain/auth-roles.md`, `technical/env-secrets-config.md` (adds
  `AUTH_SESSION_MAX_AGE_SECONDS`). Fast-follow tracked as a build milestone after core auth ships.

### ADR-016: Location ping purge via Vercel Cron
- Date: 2026-06-30
- Status: accepted
- Context: ADR-004 sets 30-day location ping retention but no purge mechanism was specified.
  Owner sign-off approved Vercel Cron.
- Decision: Purge location pings older than 30 days via a **Vercel Cron** job hitting
  `GET /api/cron/purge-location-pings` daily at **03:00 UTC** (`0 3 * * *`). Route is protected by
  **`CRON_SECRET`** (`Authorization: Bearer <CRON_SECRET>`). Purge logic is idempotent and lives in
  `lib/` (not inline in the route). Config in root `vercel.json`.
- Alternatives: Manual purge only (unacceptable at scale); separate worker/cron service (unnecessary
  on Vercel); retaining pings indefinitely (violates ADR-004 privacy intent).
- Consequences: Governs `technical/scheduled-jobs.md`, `domain/location-tracking.md`,
  `technical/env-secrets-config.md` (adds `CRON_SECRET`), root `vercel.json`.

### ADR-017: MVP flat-rate tax in scope; multi-rate/jurisdictional tax engine excluded
- Date: 2026-06-30
- Status: accepted
- Context: ADR-011 adds a single configurable flat tax rate, but `product-spec.md` §6 listed "tax"
  under full-accounting non-goals and §7 put "tax engine" in Later — creating ambiguity.
- Decision: **MVP includes a single configurable flat-rate tax multiplier** on invoices (ADR-011:
  one rate in basis points, snapshotted at finalize, applied to LABOR/PARTS/FEE subtotal). **Out of
  MVP:** multi-rate, per-jurisdiction, per-line-type, or automated tax engines. Clarify in
  `product-spec.md` that flat-rate ≠ tax engine.
- Alternatives: No tax at all (rejected — unrealistic for a service business); full tax engine now
  (non-goal / over-scoped for MVP).
- Consequences: Aligns `product-spec.md` §6/§7 with ADR-011 and `foundation/non-goals.md`. A
  multi-rate/jurisdictional engine still requires a new ADR.

---

## Pending / to-resolve before or during build (raise as ADRs when decided)
_All initial pending items resolved 2026-06-30 (see ADRs above). New items go here as they arise._
- ~~**P-1: Object storage provider**~~ — **Resolved by ADR-008** (Cloudflare R2).
- ~~**P-2: Map tile + geocoding provider**~~ — **Resolved by ADR-009** (MapTiler).
- ~~**P-3: Auth mechanism specifics**~~ — **Resolved by ADR-010** (Auth.js Credentials + seeded OWNER).
- ~~**P-4: Tax handling on invoices**~~ — **Resolved by ADR-011** (single configurable flat rate, snapshotted).
- ~~**P-5: Concurrent-timer behavior**~~ — **Resolved by ADR-012** (auto-stop previous).
- ~~**P-6: Hosting/deploy target + managed Postgres**~~ — **Resolved by ADR-013** (Vercel + Neon).
- ~~**P-7: Overpayment handling**~~ — **Resolved by ADR-014** (warn-and-allow).
