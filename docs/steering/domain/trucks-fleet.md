---
title: trucks-fleet
category: domain
appliesTo:
  - trucks
  - fleet
  - vehicle-assignment
files:
  - "**/trucks/**"
  - "**/fleet/**"
tasks:
  - manage trucks
  - assign truck to agent/job
inclusion: auto
priority: medium
dependsOn:
  - domain/jobs-lifecycle.md
  - domain/auth-roles.md
governs:
  - the Truck entity and truck assignment scope for MVP
nonGoverns:
  - agent GPS (see domain/location-tracking.md)
  - dispatch board UI (see domain/dispatch-scheduling.md)
---

# Trucks & Fleet

## 1. Intent
Track which company **truck** is assigned to whom/what — nothing more. This is a lightweight
assignment feature, **explicitly not** a telematics/fleet-management system.

## 2. MVP scope (all that is in scope)
- **Truck** entity: label/name, identifier (plate or unit #), optional make/model/year, active
  flag, timestamps.
- **Assignment**: a truck can be assigned to a **field agent** (default vehicle) and/or to a
  **job**. Assignment is optional; jobs and agents work without a truck.
- Basic availability: a truck marked inactive/out-of-service is excluded from assignment pickers.

## 3. Hard rules — explicitly REJECTED (non-goals, do not build)
- **No telematics**: no engine data, OBD-II, fuel, odometer feeds, live vehicle GPS, or
  maintenance-schedule automation.
- **No live truck location** — trucks are not tracked; only agents may emit coarse pings
  (see `location-tracking.md`), and even that is agent-scoped, not vehicle-scoped.
- No fake gauges, fake mileage, or simulated diagnostics of any kind.
- No hard deletes of trucks referenced by historical jobs — deactivate instead.
- Truck assignment/reassignment is admin-gated and audited.

## 4. Implementation guidance
- Model truck assignment as a nullable FK on Job (`truckId`) and an optional default `truckId`
  on the field-agent user record.
- Keep the trucks admin screen simple: list + create/edit/deactivate.

## 5. Failure modes to avoid
- Scope-creeping into fleet telematics or maintenance tracking.
- Inventing vehicle metrics we don't actually measure.
- Coupling truck data to agent GPS pings.

## 6. Definition of completion
Complete when trucks can be created/edited/deactivated, optionally assigned to agents and jobs
through audited admin actions, excluded when inactive, and no telematics/fake-metric surface exists.

## 7. Escalation / decision-log
Any telematics, maintenance scheduling, or real truck-location feature REQUIRES a decision-log
entry that also revisits `foundation/non-goals.md`.
