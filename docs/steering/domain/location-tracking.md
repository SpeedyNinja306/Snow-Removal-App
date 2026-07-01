---
title: location-tracking
category: domain
appliesTo:
  - gps
  - agent-location
  - location-freshness
files:
  - "**/location/**"
  - "**/tracking/**"
  - "**/lib/geo/**"
tasks:
  - implement location pings
  - show agent location on dispatch
  - define stale thresholds
inclusion: auto
priority: critical
dependsOn:
  - domain/auth-roles.md
  - domain/audit-logging.md
  - technical/maps-location-stack.md
  - technical/pwa-offline-behavior.md
  - technical/scheduled-jobs.md
governs:
  - how agent location is captured, stored, aged, labeled, and secured
  - what we may and may NOT claim about tracking
nonGoverns:
  - map rendering stack (see technical/maps-location-stack.md)
  - service location geocoding (see domain/customers-service-locations.md)
---

# Location Tracking

## 1. Intent
Give dispatch *useful, honest* awareness of where field agents are for **active jobs** — using
only what a browser/PWA can actually deliver. This is coarse, consent-based, foreground-biased
awareness, **NOT** continuous fleet tracking.

## 2. Reality constraints (must be respected and communicated)
- A PWA gets location via the **browser Geolocation API** and **requires user permission**.
- **No reliable continuous background tracking.** When the app/tab is backgrounded, the phone is
  locked, or the OS suspends it, pings stop. We do not, and must not claim to, track agents
  continuously or when the app is closed.
- Accuracy varies (GPS vs wifi/cell); indoors/cold/low-battery degrade it.
- Battery and privacy costs are real; sampling must be sparing.

## 3. Hard rules
- **Capture only while relevant**: pings are sampled while a field agent has a job in
  `EN_ROUTE` or `IN_PROGRESS` and the app is in the foreground. Not otherwise.
- **A Location Ping** stores: agent, job (nullable), lat, lng, accuracy, and `capturedAt`.
  Pings are append-only samples, not a live socket.
- **Freshness is first-class.** Every displayed location shows relative age. Thresholds:
  - **Fresh**: ≤ 2 minutes old.
  - **Aging**: 2–10 minutes old.
  - **Stale**: > 10 minutes old — must be visually marked "stale" and never implied as current.
  - **No data**: no ping in the active session — show "location unavailable".
- **Consent required**: capture only after explicit permission; if denied, degrade gracefully
  (the app fully works without location). Denial is not an error state that blocks work.
- **Least-privilege visibility**: only `DISPATCH`/`OWNER` see agent locations; a field agent sees
  only their own. Locations are never exposed to customers.
- **Retention**: keep pings only as long as operationally needed (MVP default: purge pings older
  than 30 days). Purge runs via **Vercel Cron** daily (see `technical/scheduled-jobs.md`, ADR-016).
- Enabling/disabling tracking and permission grants/denials are **audited** at a coarse level.

## 4. Implementation guidance
- Sample on an interval (e.g. every 30–60s) via `watchPosition`/`getCurrentPosition` only while
  an active job screen is foregrounded; stop when it isn't.
- Store pings server-side through a validated action; render the **latest** ping per agent on the
  board with an age label computed at render time.
- Treat missing/stale as normal, expected states in the UI.

## 5. What we MUST NEVER claim or imply
- That we track agents 24/7, in the background, or when the app is closed.
- That location is real-time/continuous, or accurate to a specific tight radius.
- That a stale ping is the agent's current position.

## 6. Failure modes to avoid
- Showing a pin with no freshness context.
- Trying to force background geolocation via hacks that break or mislead.
- Blocking job work when permission is denied.
- Retaining a permanent location history with no purge.

## 7. Definition of completion
Complete when pings capture only during active foregrounded jobs with consent, are stored with
accuracy+timestamp, are displayed with correct fresh/aging/stale/no-data labeling, are visible
only to admin/owner (+self), respect retention, and the UI/copy never overclaims capability.

## 8. Escalation / decision-log
Any push toward background/continuous tracking, a native wrapper for background GPS, changing
freshness thresholds, or changing retention REQUIRES a decision-log entry.
