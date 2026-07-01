---
title: field-agent-mobile-flow
category: domain
appliesTo:
  - field-agent-ux
  - mobile
files:
  - "**/(field)/**"
  - "**/field/**"
  - "**/mobile/**"
tasks:
  - build field agent job detail screen
  - build field agent job list
  - optimize mobile field workflow
inclusion: auto
priority: critical
dependsOn:
  - domain/jobs-lifecycle.md
  - domain/invoices-billing.md
  - domain/time-tracking.md
  - domain/job-notes-photos.md
  - technical/pwa-offline-behavior.md
governs:
  - the field agent's mobile-first workflow, priority actions, and friction budget
nonGoverns:
  - admin/dispatch surfaces (see domain/dispatch-scheduling.md)
  - offline mechanics (see technical/pwa-offline-behavior.md)
---

# Field Agent Mobile Flow

## 1. Intent
The field agent works on a **phone, one-handed, gloves-possible, in bad signal, in the cold**.
Their flow must be brutally fast: understand the job, do it, record it, bill it — minimal taps.

## 2. Priority actions (must be reachable in ≤2 taps from a job)
1. **See job essentials**: customer, location + "navigate", scheduled window, problem/notes.
2. **Advance status**: EN_ROUTE → IN_PROGRESS → COMPLETED (state machine enforced).
3. **Log time**: one-tap start/stop labor timer (see `time-tracking.md`).
4. **Add note / add photo**: capture from camera, minimal typing (see `job-notes-photos.md`).
5. **Invoice**: build/finalize invoice and record payment for their job (see `invoices-billing.md`,
   `payments.md`).

## 3. Hard rules
- **Mobile-first, thumb-reachable primary actions** (bottom-anchored, large targets).
- **No multi-step wizards** on the critical path; status/notes/photos/time are single taps or
  single short forms.
- **Bad-signal tolerant**: reads use cached job data when offline; the narrow offline write set
  (status change, note, photo capture, time start/stop) queues and syncs with clear pending
  state (per `technical/pwa-offline-behavior.md`). Never lose a queued write silently.
- **Never block the agent** on a spinner for a non-critical network call; optimistic UI with
  clear sync status where safe.
- Field agents only ever see **their own** jobs (per `auth-roles.md`).
- **"Navigate"** opens the device's native maps app to the location coords — we do not build
  turn-by-turn (per `maps-location-stack.md`).

## 4. Implementation guidance
- One scrollable Job Detail screen with a sticky action bar; sections collapse but stay on-page.
- Prefer camera capture + quick note over long forms. Default to today's assigned jobs on open.
- Show an explicit "X changes pending sync" indicator when offline writes are queued.

## 5. Failure modes to avoid
- Desktop-style dense tables/menus on the field surface.
- Deep navigation to reach status/notes/invoice.
- Claiming offline works for actions outside the supported queue set.
- Silent data loss when a queued write fails to sync.

## 6. Definition of completion
Complete when a field agent can, from a phone, go assigned → en route → in progress → completed
→ invoiced → payment recorded with the priority actions each ≤2 taps away, offline reads work,
the offline write set queues+syncs visibly, and no critical action needs a wizard.

## 7. Escalation / decision-log
Expanding the offline write set, or adding in-app turn-by-turn navigation, REQUIRES a
decision-log entry (and updates to `technical/pwa-offline-behavior.md` / `maps-location-stack.md`).
