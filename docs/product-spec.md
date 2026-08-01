# SR-App — Product Spec (MVP)

Internal field service management app for a **snow removal (plowing) company**. This spec is concrete
but scoped to the MVP. It is the product source of truth referenced by the steering docs; feature
rules live in `docs/steering/domain/*`.

---

## 1. Users
| User | Primary device | Core need |
|---|---|---|
| **Field Agent** (`FIELD_AGENT`) | Phone (PWA), often bad signal | Work assigned jobs fast: see details, update status, log time, add notes/photos, invoice + record payment. |
| **Dispatch / Admin** (`DISPATCH`) | Desktop/tablet | Schedule & assign jobs, assign trucks, oversee progress + coarse agent location, manage customers/locations/invoices/payments. |
| **Owner** (`OWNER`) | Desktop | Everything admin can do + operational/financial oversight + user management. |

## 2. Goals
- One tool to run daily operations end to end: **assigned → en route → in progress → completed →
  invoiced → paid**.
- Make the **field agent brutally fast on a phone**, tolerant of poor connectivity.
- Give **dispatch real, honest operational visibility** (status + coarse location).
- Give the **owner** financial + operational oversight.

## 3. Feature list (MVP)
- **Auth & roles** — 3 roles, server-enforced (`domain/auth-roles.md`).
- **Users/employees** — thin profiles, activate/deactivate (`domain/users-employee-profiles.md`).
- **Customers & service locations** — geocoded sites (`domain/customers-service-locations.md`).
- **Jobs** — lifecycle state machine, assignment, timestamps (`domain/jobs-lifecycle.md`).
- **Dispatch & scheduling** — assign agents/trucks, board (`domain/dispatch-scheduling.md`).
- **Field mobile flow** — priority actions ≤2 taps (`domain/field-agent-mobile-flow.md`).
- **Location tracking** — coarse, consent-based, freshness-labeled pings (`domain/location-tracking.md`).
- **Trucks/fleet** — assignment only, no telematics (`domain/trucks-fleet.md`).
- **Invoices & billing** — draft/final/paid/void, line items, printable (`domain/invoices-billing.md`).
- **Payments** — record received money, partials (`domain/payments.md`).
- **Time tracking** — labor timers/entries per job (`domain/time-tracking.md`).
- **Notes & photos** — evidence attached to jobs (`domain/job-notes-photos.md`).
- **Dashboard & reporting** — read-only oversight (`domain/dashboard-reporting.md`).
- **Notifications** — in-app event alerts (`domain/notifications.md`).
- **Audit logging** — immutable trail of key events (`domain/audit-logging.md`).

## 4. Core workflows
1. **Field job execution** (field agent): open today's assigned jobs → job detail → EN_ROUTE →
   IN_PROGRESS (start timer) → add notes/photos → COMPLETED → build & finalize invoice → record
   payment. Works read-offline; supported writes queue and sync.
2. **Dispatch scheduling** (admin): create job for customer+location → schedule → assign
   agent (+truck) → monitor board (status + coarse location + freshness) → reassign if needed.
3. **Billing to paid** (agent/admin): completed job → invoice draft (line items) → finalize
   (snapshot + invoice #) → record payment(s) → PAID → job CLOSED.
4. **Owner oversight**: dashboards for jobs by status, outstanding balance, recorded revenue,
   agent locations map (freshness-labeled).

## 5. Constraints (reality that shapes the build)
- Field devices are **phones on poor cellular** — mobile-first, low JS, offline-tolerant.
- **PWA, not native** — no reliable background GPS or continuous tracking.
- **Location is coarse + consent-based**, with freshness labeling; never presented as live 24/7.
- **Money in integer cents**, totals computed server-side.
- **Single tenant**, internal only.
- Authorization is **always server-side**; field agents are row-scoped to their own jobs.

## 6. Explicit non-goals (see `foundation/non-goals.md`)
Public/customer portal · fleet telematics/diagnostics · full accounting (GL/payroll) · native
app · payment gateway/card processing · multi-tenant SaaS · auto-routing/optimization · offline-first
CRDT sync · HR suite · **multi-rate or jurisdictional tax engines** (MVP includes only a single
configurable flat-rate tax multiplier on invoices — see ADR-011 / ADR-017).

## 7. MVP vs later
| Area | MVP | Later (needs ADR) |
|---|---|---|
| Auth | 3 roles, session auth (12h max session; immediate revocation = fast-follow, ADR-015) | SSO, self-service password reset, more roles |
| Jobs | full lifecycle state machine | recurring jobs, templates, SLAs |
| Dispatch | manual assign + list/board + coarse location | drag-drop calendar, auto-routing, hard double-book prevention |
| Location | foreground coarse pings, freshness; 30-day purge via Vercel Cron (ADR-016) | background/native tracking |
| Invoices | draft/final/paid/void, printable; **single flat-rate tax multiplier** (ADR-011) | rich PDF lib, **multi-rate/jurisdictional tax engine**, customer share portal |
| Payments | record + partials + reversals; overpayment warn-and-allow (ADR-014) | gateway/card capture, refunds, deposits |
| Media | photos + notes | video, PDF forms/checklists |
| Offline | read + narrow write queue | multi-device sync framework |
| Reporting | core operational + financial + map | exports, custom report builder, scheduled emails |
| Notifications | in-app | email/SMS/push |

## 8. Success criteria (MVP is "working")
A field agent completes the full field job execution workflow from a phone end to end; dispatch can
schedule/assign and see honest status + location; owner sees reconciled financial + operational
dashboards; all mutations are authorized + validated + audited server-side; no capability is
overclaimed.
