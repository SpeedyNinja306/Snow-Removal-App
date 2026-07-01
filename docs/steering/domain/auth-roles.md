---
title: auth-roles
category: domain
appliesTo:
  - authentication
  - authorization
  - rbac
files:
  - "**/auth/**"
  - "**/middleware.ts"
  - "**/lib/auth/**"
  - "**/lib/authz/**"
  - "**/actions/**"
tasks:
  - implement login/session
  - add or enforce permissions
  - gate a route/action by role
inclusion: auto
priority: critical
dependsOn:
  - foundation/architecture-principles.md
  - domain/audit-logging.md
governs:
  - the three roles, their boundaries, and server-side enforcement
  - session/identity rules
nonGoverns:
  - what individual features do once authorized (see each domain doc)
  - employee profile fields (see domain/users-employee-profiles.md)
---

# Auth & Roles

## 1. Intent
Define exactly what each role can do and guarantee that **authorization is enforced on the
server for every mutation and protected read** — never trusted from the client.

## 2. Roles (exactly three in MVP)
- **`FIELD_AGENT`** — the technician. Sees/works **only jobs assigned to them** (plus the
  customers/locations of those jobs). Can update status, log time, add notes/photos, and
  create/finalize the invoice for their jobs and record a payment. Cannot manage users,
  reassign jobs, or view other agents' jobs/finances.
- **`DISPATCH`** — admin/back-office. Full CRUD on customers, service locations, jobs,
  assignments, trucks, invoices, payments. Sees all jobs, the dispatch board, and coarse agent
  locations. Cannot change roles/create owner-level users unless owner (configurable later).
- **`OWNER`** — everything `DISPATCH` can do **plus** reporting/oversight dashboards and user
  management. Superset of dispatch.

Role is **hierarchical for admin surfaces** (OWNER ⊇ DISPATCH) but **FIELD_AGENT is a distinct,
narrower surface**, not a subset.

## 3. Hard rules
- **Every Server Action and protected Route Handler** starts by resolving the session and
  authorizing the action against the resource. No exceptions.
- **Never trust client-sent identity or role.** Derive the user/role from the server session only.
- **Field agents are scoped to their own jobs** at the query level (row-level ownership checks),
  not just hidden in the UI.
- **Deny by default.** If a permission is not explicitly granted, it is denied.
- Authorization failures return a **403-style result**, are not silently ignored, and
  security-relevant denials/logins are audited (see `domain/audit-logging.md`).
- Passwords (if credentials auth) are hashed with a strong adaptive algorithm; sessions use
  secure, httpOnly cookies.
- **Session max age (ADR-015):** JWT/session cookies expire after **12 hours** (`AUTH_SESSION_MAX_AGE_SECONDS=43200`).
  This is the MVP value (within the approved 8–24h window). Sessions must not be long-lived.
  **Immediate invalidation on role change or user deactivation is NOT in MVP** — an active session
  remains valid until expiry. **Required fast-follow (not deferred indefinitely):** invalidate
  all sessions for a user on role change or deactivation (session version / token revocation).
  Until that ships, re-fetch `active` + role from the DB on every sensitive mutation (not just
  reads) and deny if the user is deactivated or the role no longer permits the action.

## 4. Implementation guidance
- Centralize checks in a `lib/authz` module: `requireRole(role)`, `requireOwnerOfJob(jobId)`,
  `can(user, action, resource)`. Actions call these first.
- Encode role in the session; **re-fetch `active` + role from the DB on every sensitive mutation**
  (see ADR-015 interim mitigation until session invalidation fast-follow ships).
- UI hiding is a convenience, never the enforcement boundary.

## 5. Failure modes to avoid
- Checking role in a client component and assuming that protects data.
- Field agent able to load another agent's job by guessing an id.
- "God" endpoints that skip authz because they're "internal".

## 6. Definition of completion
Auth is complete for a feature when: session is required, role/ownership is checked server-side,
field-agent row scoping is enforced in queries, denials are audited, and there is a test proving
an unauthorized user is blocked.

## 7. Escalation / decision-log
Adding a fourth role, changing role hierarchy, or adopting a specific auth provider/library
version REQUIRES a decision-log entry.
