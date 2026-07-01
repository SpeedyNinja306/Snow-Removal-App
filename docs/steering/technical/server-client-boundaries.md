---
title: server-client-boundaries
category: technical
appliesTo:
  - rsc
  - client-components
  - data-fetching
files:
  - "app/**"
  - "src/app/**"
  - "components/**"
  - "lib/**"
tasks:
  - decide server vs client component
  - fetch data / mutate data
inclusion: auto
priority: high
dependsOn:
  - foundation/architecture-principles.md
governs:
  - what runs on the server vs client and where the trust boundary sits
nonGoverns:
  - route layout (see technical/nextjs-app-structure.md)
  - validation specifics (see technical/api-actions-validation.md)
---

# Server / Client Boundaries

## 1. Intent
Keep the app server-first, minimize client JS, and make the trust boundary unambiguous.

## 2. Hard rules
- **Default to Server Components.** Add `"use client"` only for genuine interactivity: forms with
  local state, maps, camera/upload, timers, offline queue, charts.
- **Data fetching happens on the server** (RSC or server actions). Client components receive data
  as props or via server actions — no direct DB access, no secrets client-side.
- **The trust boundary is the server.** Every server action/handler re-validates input (Zod) and
  re-checks authorization (`auth-roles.md`) regardless of what the client did.
- **No secrets, tokens, or service keys in client bundles** (see `env-secrets-config.md`).
  Only `NEXT_PUBLIC_*` values may reach the client.
- Keep client components **leaf-level and small**; push data/logic up to the server.
- Presigned upload URLs are minted server-side; the client uses them but cannot mint them
  (see `file-upload-strategy.md`).

## 3. Implementation guidance
- Pattern: server page → fetch + authorize → pass minimal props → small client island for interaction.
- Co-locate a feature's server actions in `lib/<feature>/actions.ts` marked `"use server"`.
- Avoid shipping large libs to the client; prefer server rendering (e.g. invoice print view).

## 4. Failure modes to avoid
- Fetching in `useEffect` what could be fetched on the server.
- Trusting props/ids from the client without server re-check.
- Leaking env/secrets into client components.
- Turning whole pages into client components for one interactive widget.

## 5. Definition of completion
Complete when interactivity is isolated to small client islands, all data/authz lives server-side,
no secrets reach the client, and mutations re-validate + re-authorize on the server.

## 6. Escalation / decision-log
Introducing a client-side data-fetching layer (e.g. React Query as the primary path) REQUIRES a
decision-log entry (coordinate with `technical/state-management.md`).
