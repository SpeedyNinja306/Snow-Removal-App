---
title: customers-service-locations
category: domain
appliesTo:
  - customers
  - service-locations
files:
  - "**/customers/**"
  - "**/locations/**"
  - "**/service-locations/**"
tasks:
  - manage customers
  - add/edit service locations
  - link a job to a customer/location
inclusion: auto
priority: high
dependsOn:
  - domain/jobs-lifecycle.md
governs:
  - customer records and their service locations (addresses + geocoding)
nonGoverns:
  - job workflow (see domain/jobs-lifecycle.md)
  - billing (see domain/invoices-billing.md)
---

# Customers & Service Locations

## 1. Intent
Model who we serve and where. A **Customer** is the billing/contact entity; a **Service
Location** is a physical site where jobs happen. One customer can have many locations.

## 2. Hard rules
- **Customer**: name (person or business), primary contact (phone/email), optional billing
  notes, active flag, timestamps.
- **Service Location**: belongs to exactly one Customer; has a structured address, optional
  unit/access notes, and **latitude/longitude** (geocoded once, stored — see below).
- A **Job references both a Customer and a Service Location** (the location must belong to that
  customer). Enforce this referential rule server-side.
- **No hard deletes** if referenced by any job/invoice — deactivate instead.
- Geocoding is done at save time and **persisted**; do not geocode on every map render.
- Editing a customer/location does **not** retroactively rewrite historical invoice snapshots
  (invoices snapshot their own billing info — see `domain/invoices-billing.md`).

## 3. Implementation guidance
- Store lat/lng as separate numeric columns (map-ready) plus the raw address text.
- If geocoding fails, save the address and flag `geocoded = false`; allow manual coordinates.
- Location picker for jobs is filtered to the selected customer's locations.

## 4. Failure modes to avoid
- Geocoding addresses live inside map components (slow, rate-limited, non-deterministic).
- Allowing a job to point at a location that belongs to a different customer.
- Deleting a customer that has historical jobs/invoices.

## 5. Definition of completion
Complete when customers and their locations can be created/edited/deactivated, locations carry
persisted geo-coordinates, job creation enforces customer↔location integrity, and referenced
records cannot be hard-deleted.

## 6. Escalation / decision-log
Choosing a specific geocoding provider (and its rate limits/costs) REQUIRES a decision-log entry
(coordinate with `technical/maps-location-stack.md`).
