---
title: users-employee-profiles
category: domain
appliesTo:
  - user-management
  - employee-profiles
files:
  - "**/users/**"
  - "**/employees/**"
  - "**/profile/**"
tasks:
  - manage employees/users
  - edit employee profile
  - deactivate a user
inclusion: auto
priority: high
dependsOn:
  - domain/auth-roles.md
governs:
  - user/employee records, activation state, and profile fields
nonGoverns:
  - permission enforcement (see domain/auth-roles.md)
  - time tracking / labor (see domain/time-tracking.md)
---

# Users & Employee Profiles

## 1. Intent
Manage the people who use SR-App: their identity record, role, contact info, and active status.
Kept deliberately thin — this is not an HR system (see `foundation/non-goals.md`).

## 2. Hard rules
- A **User** has: name, email (unique, login identity), role, active flag, created/updated
  timestamps, and optional phone. Field agents may have an assigned default **Truck**.
- **No hard deletes of users.** Deactivate (`active = false`) instead — historical jobs,
  invoices, time entries, and audit events must keep referencing the user.
- Only `OWNER` can create users, change roles, or reactivate/deactivate (per `auth-roles.md`).
- Deactivated users cannot log in and are excluded from assignment pickers, but remain visible
  on historical records.
- Changing a user's role or active state is an **audited event**.

## 3. Implementation guidance
- Keep employee profile fields minimal for MVP: contact + role + default truck. Avoid HR fields
  (SSN, pay rate, emergency contacts) unless a decision-log entry adds them.
- Assignment pickers query `active = true` field agents only.

## 4. Failure modes to avoid
- Deleting a user and orphaning historical jobs/invoices.
- Storing pay/HR/PII fields not needed for operations.
- Letting non-owners change roles.

## 5. Definition of completion
User management is complete when owners can create/deactivate/edit users and change roles,
deactivation preserves history and blocks login, and all such changes are audited.

## 6. Escalation / decision-log
Adding pay rates, HR fields, or self-service password reset flows REQUIRES a decision-log entry.
