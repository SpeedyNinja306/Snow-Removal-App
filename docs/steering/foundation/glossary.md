---
title: glossary
category: foundation
appliesTo:
  - shared-vocabulary
files:
  - "**/*"
tasks:
  - any task using domain terms
inclusion: agent-requested
priority: medium
dependsOn:
  - foundation/product-goal.md
governs:
  - canonical definitions of domain terms and entity names
nonGoverns:
  - behavior/rules for those entities (see domain/*)
---

# Glossary

> `inclusion: agent-requested` — pull this in when you need the canonical name/definition of a
> term. It is intentionally not always-on to keep the global set tiny.

## Entities & terms
- **User** — an authenticated person. Has exactly one primary **Role**.
- **Role** — `OWNER`, `DISPATCH`, or `FIELD_AGENT`. Governs permissions (see `domain/auth-roles.md`).
- **Field Agent** — the technician who performs service in the field via the mobile PWA.
- **Dispatch / Admin** — schedules, assigns, and oversees jobs; back-office surface.
- **Owner** — full access plus reporting/oversight.
- **Customer** — the person/business paying for service. Has one or more Service Locations.
- **Service Location** — a physical site where work happens (address + geo). Belongs to a Customer.
- **Job** — the unit of work; the operational system of record. Has a status lifecycle, an
  assigned agent, an optional truck, time entries, notes, photos, and (usually) an invoice.
- **Job Status** — the lifecycle state of a Job (see `domain/jobs-lifecycle.md` for the canonical list).
- **Assignment** — linking a Job to a Field Agent (and optionally a Truck).
- **Truck** — a company vehicle that can be assigned to an agent/job (see `domain/trucks-fleet.md`).
- **Invoice** — the billing document for a Job. States: draft → final → paid (see `domain/invoices-billing.md`).
- **Line Item** — a billable entry on an Invoice (labor, parts, fees).
- **Payment** — a recorded receipt against an Invoice (see `domain/payments.md`).
- **Time Entry** — labor time logged against a Job (see `domain/time-tracking.md`).
- **Note** — a text log entry on a Job (see `domain/job-notes-photos.md`).
- **Photo / Media** — an image (or file) attached to a Job (see `domain/job-notes-photos.md`).
- **Location Ping** — a coarse, timestamped position sample tied to an agent/job while active
  (see `domain/location-tracking.md`). NOT continuous tracking.
- **Audit Event** — an immutable record of a significant action (see `domain/audit-logging.md`).
- **Freshness / Stale** — how recent a location ping is; "stale" past a threshold
  (see `domain/location-tracking.md`).
- **Dispatch Board** — the admin view of jobs + assignments + coarse locations
  (see `domain/dispatch-scheduling.md`).

## Naming conventions
Use these exact entity names in schema, types, and UI copy. Do not invent synonyms
(e.g. "ticket" for Job, "client" for Customer, "worker" for Field Agent).
