---
title: invoices-billing
category: domain
appliesTo:
  - invoices
  - billing
  - line-items
files:
  - "**/invoices/**"
  - "**/billing/**"
  - "**/lib/invoicing/**"
tasks:
  - build invoice schema
  - create/edit invoice
  - finalize invoice
  - print/share invoice
inclusion: auto
priority: critical
dependsOn:
  - domain/jobs-lifecycle.md
  - domain/payments.md
  - domain/audit-logging.md
  - domain/auth-roles.md
governs:
  - invoice states, line items, edit controls, totals, and printable/shareable output
nonGoverns:
  - recording money received (see domain/payments.md)
  - accounting/GL/tax filing (non-goal)
---

# Invoices & Billing

## 1. Intent
Turn completed work into a clear, correct billing document that can be finalized, shared, and
marked paid. Billing, not accounting (see `foundation/non-goals.md`).

## 2. Invoice states (exact set)
1. `DRAFT` — editable; line items and amounts can change freely.
2. `FINAL` — issued to the customer; **locked from edits** except via explicit correction flow.
3. `PAID` — fully paid (derived/confirmed from recorded payments — see `payments.md`).
4. `VOID` — canceled/invalidated after finalization; terminal, retains record.

Legal transitions: `DRAFT → FINAL`, `FINAL → PAID`, `FINAL → VOID`, `PAID → VOID` (rare, audited,
requires reason). No `FINAL → DRAFT` (use a correction/void+reissue flow).

## 3. Hard rules
- An invoice **belongs to exactly one Job** (and through it, one Customer/Location).
- **Line items**: description, quantity, unit price, line total; typed category
  (`LABOR | PARTS | FEE | DISCOUNT`). Totals = sum of line totals; store subtotal, tax, and grand
  total. **Compute totals server-side**; never trust client-sent totals.
- **Tax (ADR-011)**: a **single configurable flat rate** (basis points, integer) applied to the
  **taxable subtotal** — `LABOR`, `PARTS`, `FEE` are taxable; `DISCOUNT` reduces the taxable base.
  The rate in effect is **snapshotted onto the invoice at `DRAFT → FINAL`** so later config changes
  never rewrite issued invoices. Default rate is config-driven (`DEFAULT_TAX_RATE_BPS`) and may be
  `0` (no tax).
- **Money is stored in integer minor units** (cents) — never floats.
- **Edit controls:**
  - `DRAFT`: fully editable by the job's field agent or admin/owner.
  - `FINAL`/`PAID`: **immutable line items.** Corrections happen via `VOID` + reissue, or a
    dedicated adjustment line under an admin-only correction flow — both audited.
- **Snapshotting**: on `DRAFT → FINAL`, snapshot the customer/location billing info and an
  invoice number so later edits to the customer record don't rewrite history.
- **`COMPLETED → CLOSED` on the job requires a `FINAL` (or `PAID`) invoice** (see `jobs-lifecycle.md`).
- **Payment recording is out of scope here** — this doc owns the document; `payments.md` owns
  received money. `PAID` state is driven by payment totals covering the grand total.
- Every state change (finalize/void) and post-final correction is **audited**.

## 4. Printable / shareable expectations (MVP)
- A `FINAL`/`PAID` invoice must render to a **clean, printable view** (print-friendly HTML/PDF)
  showing company info, customer, job/location, line items, totals, invoice number, date, and
  payment status.
- "Shareable" in MVP = printable/PDF the agent can hand off or send; **not** a customer login
  portal (non-goal). A share link, if built, must be access-controlled/expiring (log a decision).

## 5. Implementation guidance
- Keep invoicing math in `lib/invoicing` (pure, unit-tested) — quantities × unit price, rounding
  rules, flat-rate tax on the taxable subtotal (ADR-011), totals.
- Generate a monotonic, human-readable invoice number at finalize time.
- Field agents can build/finalize invoices for **their own** jobs only.

## 6. Failure modes to avoid
- Editing a FINAL/PAID invoice's line items in place.
- Float money math or client-computed totals.
- Deriving PAID without actual recorded payments.
- Treating "share" as a customer portal.

## 7. Definition of completion
Complete when invoices attach to a job, support typed line items with server-computed integer
totals, enforce the state machine and edit locks, snapshot billing info + invoice number at
finalize, render a printable view, and audit finalize/void/correction — with PAID driven by
`payments.md`.

## 8. Escalation / decision-log
Adding tax logic beyond a flat rate, real PDF generation library, customer share portal, or a
payment gateway REQUIRES a decision-log entry.
