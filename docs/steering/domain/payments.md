---
title: payments
category: domain
appliesTo:
  - payments
  - payment-recording
files:
  - "**/payments/**"
  - "**/lib/payments/**"
tasks:
  - add invoice payment recording
  - build payment schema
inclusion: auto
priority: high
dependsOn:
  - domain/invoices-billing.md
  - domain/audit-logging.md
  - domain/auth-roles.md
governs:
  - recording money received against invoices and deriving paid status
nonGoverns:
  - invoice document/line items (see domain/invoices-billing.md)
  - card processing / gateways (non-goal in MVP)
---

# Payments

## 1. Intent
Record money **received** against invoices so the business knows what's paid, partially paid, or
outstanding. We **record** payments; we do **not** process card charges in MVP.

## 2. Hard rules
- A **Payment** records: invoice, amount (integer minor units/cents), method
  (`CASH | CHECK | CARD_EXTERNAL | E_TRANSFER | OTHER`), `receivedAt`, optional reference
  (check #, external txn note), and the user who recorded it.
- **We are not a payment processor.** `CARD_EXTERNAL` means the card was run on a separate
  terminal/app; we only store the fact + reference. No PAN/CVV/card data is ever stored.
- **Payments attach only to `FINAL` (or `PAID`) invoices** — you cannot record payment on a DRAFT.
- **Partial payments allowed.** An invoice becomes `PAID` only when the sum of non-voided
  payments **≥ grand total**. Track `amountPaid` and `balanceDue` (derived, server-side).
- **Overpayment** is **warn-and-allow** (ADR-014): the full amount is recorded even if it exceeds
  the grand total, the invoice still becomes `PAID` once summed non-voided payments ≥ grand total,
  and the overpaid delta is surfaced as a flag. No refund/credit-balance workflow in MVP; a mistaken
  overpayment is corrected via a reversing payment. **Overpayment events are explicitly audited**
  (action `payment.overpayment_recorded`; metadata includes overpaid delta — see `domain/audit-logging.md`).
- Payments are **append-only**; a mistaken payment is reversed by a **negative/void adjustment
  payment**, never by editing/deleting the original. All payment records and reversals are audited.
- Field agents may record payments for **their own** jobs' invoices; admin/owner for any.

## 3. Implementation guidance
- Keep `amountPaid`/`balanceDue`/`PAID` derivation in one server function reused by UI + status.
- Recompute invoice `PAID` state transactionally when a payment is added/reversed.
- Store money in cents; format for display only at the edge.

## 4. Failure modes to avoid
- Storing raw card data or implying we charge cards.
- Editing/deleting a payment to "fix" it instead of recording a reversal.
- Marking PAID from a client flag instead of summed payments.
- Allowing payment on a DRAFT invoice.

## 5. Definition of completion
Complete when payments can be recorded (with method/amount/reference) only against final invoices,
partials sum correctly to derive PAID, reversals are additive and audited, no card data is stored,
and role scoping is enforced.

## 6. Escalation / decision-log
Integrating a real payment gateway, storing any card data, or adding refund/deposit workflows
REQUIRES a decision-log entry (and revisiting `foundation/non-goals.md`).
