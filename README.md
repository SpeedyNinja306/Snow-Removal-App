# SR-App

Internal field service management app for a snow removal (plowing) company. Field agents work
jobs from a phone, dispatch schedules and watches progress, and the owner gets oversight.

Product scope lives in [`docs/product-spec.md`](docs/product-spec.md); decisions in
[`docs/decision-log.md`](docs/decision-log.md). If you are an AI agent, start with
[`AGENTS.md`](AGENTS.md).

## Current state

Scaffold only. Authentication, role-based routing and one placeholder screen per role exist.
There are **no** customers, jobs, invoices, payments, trucks, uploads, maps or offline behaviour
yet — those arrive as their own feature slices.

## Stack

Next.js 16 (App Router, React Server Components) · TypeScript strict · Tailwind CSS 4 ·
PostgreSQL via Prisma 7 · Auth.js v5 (Credentials + argon2id) · Zod at every trust boundary.

## Local setup

Requires Node 22+ and Docker.

```bash
cp .env.example .env.local     # then fill in AUTH_SECRET and SEED_OWNER_*
docker compose up -d           # Postgres on localhost:5432
npm install                    # also generates the Prisma client
npm run db:migrate             # apply migrations
npm run db:seed                # create the first OWNER from SEED_OWNER_*
npm run dev
```

Generate `AUTH_SECRET` with `openssl rand -base64 32`. `SEED_OWNER_PASSWORD` must be at least
12 characters. Then open http://localhost:3500 and sign in; `/` forwards each role to its surface.

`npm run dev` uses port **3500**, not Next's default 3000, because Windows/Hyper-V commonly reserves
the 2850–3481 range and binding there fails with `EACCES`. If you change the port, change `AUTH_URL`
and `APP_URL` in `.env.local` to match, or Auth.js callbacks will point at the wrong origin.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm run typecheck` | `tsc --noEmit` (runs in CI) |
| `npm run lint` | ESLint (runs in CI) |
| `npm run db:migrate` | Create/apply a migration in development |
| `npm run db:deploy` | Apply existing migrations (deployment) |
| `npm run db:seed` | Seed the first OWNER (idempotent) |
| `npm run db:reset` | Drop, re-migrate and reseed — **local only, destroys data** |
| `npm run db:studio` | Inspect data in Prisma Studio |
| `npm run db:generate` | Regenerate the Prisma client into `lib/generated/prisma` |

## Layout

```
app/(auth)/      login screen
app/(field)/     FIELD_AGENT surface           → /field
app/(admin)/     DISPATCH + OWNER surfaces     → /dispatch, /owner
lib/auth/        Auth.js config, credentials provider, argon2id, login actions
lib/authz/       server-side role gates (requireRoles) + the route→role map
lib/db/          Prisma client (the only data-access layer)
lib/env.ts       Zod-validated server configuration
proxy.ts         request pre-check (Next.js 16's renamed middleware)
prisma/          schema, migrations, seed
```

## Authorization

Roles are `OWNER`, `DISPATCH` and `FIELD_AGENT`. `OWNER` is a superset of `DISPATCH` for admin
surfaces; `FIELD_AGENT` is a separate, narrower surface.

Every gated route is checked on the server twice: `proxy.ts` rejects unauthorized requests early,
and the surface layout **and** page call `requireRoles()`, which re-reads the role and the `active`
flag from the database rather than trusting the session cookie. Hiding UI is never the boundary.
