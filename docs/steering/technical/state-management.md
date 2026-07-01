---
title: state-management
category: technical
appliesTo:
  - client-state
  - forms
files:
  - "components/**"
  - "app/**"
  - "**/lib/offline/**"
tasks:
  - manage client state
  - build a form
inclusion: agent-requested
priority: medium
dependsOn:
  - technical/server-client-boundaries.md
  - technical/api-actions-validation.md
governs:
  - the minimal, server-first state strategy on the client
nonGoverns:
  - server data fetching (see technical/server-client-boundaries.md)
---

# State Management

> `inclusion: agent-requested` — pull in when a task involves non-trivial client state.

## 1. Intent
Keep client state minimal. The server is the source of truth; the client holds only ephemeral UI
state and the offline queue.

## 2. Hard rules
- **Server is source of truth.** Prefer server components + server actions + `revalidate` over
  client caches. Don't mirror server data into a global client store.
- **URL/search params** hold shareable view state (filters, tabs, selected date) on admin surfaces.
- **Local component state** (`useState`/`useReducer`) for transient UI (open/closed, form fields).
- **Forms**: use server actions with `useFormState`/`useFormStatus` (or equivalent) + the shared
  Zod schema for client-side hints; server remains authoritative.
- **No global client store by default.** If genuinely needed for cross-component ephemeral state
  (e.g. offline queue status, active timer), a small store (e.g. Zustand) is acceptable — but log
  a decision and scope it to that concern, not app-wide server data.
- The **offline queue** (`lib/offline`) is the one sanctioned persistent client store (IndexedDB).

## 3. Implementation guidance
- Derive, don't duplicate: compute from props/server data instead of copying into state.
- Keep forms controlled minimally; lean on native form + server action results.

## 4. Failure modes to avoid
- Introducing Redux/global stores to hold server data.
- Client caches that drift from the server.
- Storing view state only in memory when it should be in the URL.

## 5. Definition of completion
Complete when client state is limited to ephemeral UI + the offline queue, shareable view state
lives in the URL, forms use server actions with shared schemas, and no global store shadows server data.

## 6. Escalation / decision-log
Adding any global client store or a client data-fetching/caching library REQUIRES a decision-log entry.
