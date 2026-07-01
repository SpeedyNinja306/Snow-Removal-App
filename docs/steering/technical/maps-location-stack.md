---
title: maps-location-stack
category: technical
appliesTo:
  - maps
  - geolocation-api
files:
  - "**/map/**"
  - "**/maps/**"
  - "**/lib/geo/**"
tasks:
  - render a map
  - integrate geolocation
  - add navigate-to-location
inclusion: auto
priority: medium
dependsOn:
  - domain/location-tracking.md
  - technical/server-client-boundaries.md
governs:
  - the mapping/geolocation technology choices and their usage rules
nonGoverns:
  - location capture semantics/freshness (see domain/location-tracking.md)
---

# Maps & Location Stack

## 1. Intent
Standardize how we render maps and read device location, with honest capability and controlled cost.

## 2. Hard rules
- **Map rendering: MapLibre GL** with a configurable tile/style provider. The provider (and its
  API key/usage limits/cost) is chosen via a decision-log entry; keys are server-injected or
  `NEXT_PUBLIC_*`-scoped per provider rules.
- **Device location: browser Geolocation API only** (`getCurrentPosition`/`watchPosition`). No
  third-party native location SDKs in MVP.
- **Navigation is delegated**: "Navigate" opens the device's native maps app via a geo/URL scheme
  to stored coords — **we do not build turn-by-turn**.
- Maps are **client components** (leaf islands); coordinates come from server-fetched, persisted
  data (`customers-service-locations.md`) or from location pings (`location-tracking.md`).
- **Freshness/consent/privacy semantics are owned by `location-tracking.md`** — this doc must not
  redefine them; render whatever labels that doc mandates.
- Respect rate limits/cost of geocoding + tiles; **persist geocoding** (don't geocode per render).

## 3. Implementation guidance
- Wrap MapLibre in a single `Map` component with typed props (markers, center, zoom); reuse it for
  dispatch board map tab and dashboard map view.
- Wrap Geolocation access in `lib/geo` with permission handling and graceful denial.
- Keep tiles/styles configurable via env so provider can change without code churn.

## 4. Failure modes to avoid
- Redefining freshness/tracking rules here (belongs to the domain doc).
- Building custom routing/turn-by-turn.
- Geocoding on every render or hardcoding a provider key.
- Loading a heavy map on surfaces that only need a static list.

## 5. Definition of completion
Complete when maps render via a single reusable MapLibre component fed by persisted coords, device
location uses the Geolocation API with graceful permission handling, navigate delegates to native
maps, and all freshness/privacy labeling defers to `location-tracking.md`.

## 6. Escalation / decision-log
Choosing/changing the tile+geocoding provider, or adding any native/background location capability,
REQUIRES a decision-log entry.
