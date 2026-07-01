---
title: pwa-offline-behavior
category: technical
appliesTo:
  - pwa
  - offline
  - service-worker
files:
  - "**/service-worker*"
  - "**/sw.*"
  - "**/manifest.*"
  - "**/lib/offline/**"
tasks:
  - implement offline queue
  - configure service worker/PWA
inclusion: auto
priority: high
dependsOn:
  - domain/field-agent-mobile-flow.md
  - technical/server-client-boundaries.md
governs:
  - what "offline" means in MVP and the exact supported offline write set
nonGoverns:
  - field UX priorities (see domain/field-agent-mobile-flow.md)
  - location capture (see domain/location-tracking.md)
---

# PWA & Offline Behavior

## 1. Intent
Make the field surface usable in poor/no connectivity **without overpromising**. Offline is
**narrow, explicit, and honest** — not a full offline-first sync engine (see `foundation/non-goals.md`).

## 2. What "offline" means in MVP (the contract)
- **Offline reads**: the field agent's **currently assigned jobs** and their essential detail
  (customer, location + coords, notes, existing photos metadata) are cached and readable offline.
- **Offline writes — the SUPPORTED SET only**:
  1. Job **status transitions** (validated legality re-checked on sync).
  2. **Notes** (create).
  3. **Photo capture** (queued file + metadata, uploaded on reconnect).
  4. **Time entry** start/stop (with real timestamps).
- Writes are **queued locally**, show a visible **"pending sync"** state, and sync automatically on
  reconnect (with manual retry). Real capture timestamps are preserved.

## 3. What is NOT guaranteed offline (must be communicated, not faked)
- Invoicing/payment finalization, dispatch/admin surfaces, reporting, maps tiles, and any
  cross-entity operations are **online-only** in MVP.
- Offline is **best-effort within one device/session**; no multi-device offline merge, no CRDTs.
- If the browser evicts cache/storage, queued items may be lost — so **surface queue state clearly**
  and sync early.

## 4. Hard rules
- **Server re-validates every synced write** (auth, ownership, transition legality, Zod). A queued
  status change that became illegal must fail gracefully and inform the agent — never silently drop.
- **Conflict handling**: last-write context is re-checked server-side; on conflict, surface it to
  the agent rather than overwrite blindly.
- **No silent data loss.** A queued write that fails to sync stays visible with an error + retry.
- The service worker caches **app shell + own assigned-job data only**, scoped per user; clear on logout.

## 5. Implementation guidance
- Use a small offline queue in `lib/offline` (IndexedDB) with typed queued-action records.
- Photos: store the blob locally, upload via presigned URL on reconnect (per `file-upload-strategy.md`).
- Show a global sync/status indicator (online/offline + N pending) on the field surface.

## 6. Failure modes to avoid
- Claiming full offline for actions outside the supported set.
- Dropping or double-applying queued writes.
- Caching another user's data or leaving cache after logout.
- Applying a stale offline status change without re-validating legality.

## 7. Definition of completion
Complete when assigned-job reads work offline, the supported write set queues with visible pending
state and syncs with server re-validation, conflicts/failures are surfaced (never silent), and the
UI never claims unsupported offline capability.

## 8. Escalation / decision-log
Expanding the offline write set, adding multi-device sync, or adopting a sync framework REQUIRES a
decision-log entry.
