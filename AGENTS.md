# AGENTS.md — Master Agent Guidance (SR-App)

> **SR-App** is an internal **field service management app for a snow removal (plowing) company**.
> Users: **field agents**, **dispatch/admin**, and the **owner**.
> This file is the single entry point for any AI agent working in this repository.

---

## 1. What this project is (read this first, once)

A mobile-first, role-based operations app that runs a snow removal (plowing) business end to end:

- **Field agents** work jobs from a phone in the field (often bad signal): see job details,
  update job status, log time, add notes/photos, and produce/hand off an invoice.
- **Dispatch/admin** schedule and assign jobs, assign trucks, watch job progress and rough
  agent location, and manage customers, service locations, invoices, and payments.
- **Owner** sees operational and financial oversight (dashboards/reporting) on top of admin.

Core entities: **Users/roles, Customers, Service Locations, Jobs, Trucks, Invoices, Payments,
Time entries, Notes, Photos, Location pings, Audit events.**

The product is operationally in the spirit of a field-service platform (fast field workflows +
dispatch visibility + billing), scoped to a **realistic MVP** — not an enterprise clone.

---

## 2. How to work here (mandatory)

Rules live in two layers: **`.cursor/rules/*.mdc`** are the operational rules Cursor's engine
actually reads (the 5 foundation rules auto-apply to every task; the rest attach by file glob or
on request). **`docs/steering/**/*.md`** are the matching detailed reference docs (1:1). The
`.mdc` is authoritative; open its detailed doc when you need the full rationale.

1. **Before doing anything on a task, open `docs/steering/_index.md` and
   `docs/steering/_loading-strategy.md`.** They tell you exactly which rules to load for your
   task and which to leave out.
2. **Load narrowly.** The 5 always-on foundation rules are tiny by design. Everything else is
   loaded *only when relevant*. **Do not load the entire rule set** unless you are explicitly
   doing cross-cutting architecture work.
3. **Match your task to the Task Routing Matrix** in `_loading-strategy.md`. If your task is
   not listed, pick the closest row and note the deviation.
4. **Every rule declares its own boundaries** (`governs` / `nonGoverns` in the detailed doc).
   Respect them. If two rules seem to conflict, higher `priority` wins; if still unclear, log a decision.
5. **You are usually NOT authorized to build the whole app.** Build only the feature/slice the
   current task asks for.

---

## 3. Non-negotiable rules for every agent

- **No fake completion.** Never mark a feature done if it is stubbed, mocked, or only partially
  wired. Say precisely what works and what does not.
- **Be honest about MVP limits.** Especially for offline, GPS, and telematics — never claim
  capabilities the platform cannot truthfully deliver (see `domain/location-tracking.md`,
  `technical/pwa-offline-behavior.md`, `domain/trucks-fleet.md`).
- **Log unresolved ambiguity.** If a decision is architectural, product-shaping, or you had to
  guess, add an entry to `docs/decision-log.md` following `foundation/decision-log-policy.md`.
- **Enforce security server-side.** Roles/permissions are enforced on the server, never trusted
  from the client (see `domain/auth-roles.md`).
- **Preserve product coherence.** Every change must keep serving the field-service goal in
  `foundation/product-goal.md` and must not violate `foundation/non-goals.md`.
- **Respect change policies.** Schema, API, and UI changes have explicit processes in
  `docs/steering/process/`.

---

## 4. Repository map

```
AGENTS.md                     ← you are here
.cursor/rules/*.mdc           ← OPERATIONAL rules Cursor reads (foundation-*, domain-*, technical-*, process-*)
.env.example                  ← env template (copy to .env.local); real .env is git-ignored
docker-compose.yml            ← local Postgres for dev (prod = Neon, ADR-013)
docs/
  product-spec.md             ← concrete MVP spec (users, features, workflows, non-goals)
  decision-log.md             ← append-only record of decisions (ADR-001…017)
  steering/
    _index.md                 ← catalog mapping every .mdc rule + "what to open first"
    _loading-strategy.md      ← context-minimization + Task Routing Matrix
    foundation/ domain/ technical/ process/   ← detailed reference docs (1:1 with .mdc rules)
```

## 5. Inclusion model (how rules attach in Cursor)

Each `.cursor/rules/*.mdc` uses this frontmatter to control loading:

- `alwaysApply: true` — always injected (globs/description ignored). **Foundation only (5 rules).**
- `alwaysApply: false` + `globs` — auto-attaches when matching files are opened/edited.
- `alwaysApply: false` + `description` (no globs) — you pull it in when the description matches your task.
- `alwaysApply: false` + neither — manual `@`-mention only (unused here).

Keep the always-on set small (exactly 5). When in doubt, prefer glob/description over `alwaysApply: true`.
