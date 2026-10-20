# 0006. Mobile collections: payment plans, payments by method, credit rule

- **Status**: Accepted — replaces the COLLECTION placeholder of ADR 0004.
- **Date**: 2026-10-13
- **Related**: API ADR 0020 (collections), ADR 0003 (offline-first), ADR 0005 (orders).

---

## Context

Sellers collect money in COLLECTION visits, usually without coverage. A customer pays an order
once or weekly, with cash, transfer, deposit, check or card. The app must show what each
customer owes, register payments offline and never let the seller collect twice.

## Decision

- **Local model**: `receivables` + `receivable_installments` (pulled; the receivable of an
  order taken offline is created locally with the order id, like the server) and `payments`
  (created offline, pushed as `PAYMENT CREATE`, with the receipt photo uploaded first).
- **Same arithmetic as the API** (`core/value-objects/payment-schedule.ts`, integer cents):
  equal weekly installments with the remainder on the last one, payments applied oldest
  installment first, never above the balance, overdue = unpaid installments past their due
  date minus the grace days.
- **Orders**: the review step has a payment plan picker (once / weekly, number of payments,
  first due date, preview of each installment). Explicit dates are sent so the server builds
  the same installments.
- **Credit rule**: the pull carries `settings` (`blockOrdersWhenOverdue`, `overdueGraceDays`),
  stored in `sync_meta`. With overdue installments the order screen shows the balance and
  "Registrar cobro" instead of the catalog, and the repository refuses the order too.
- **Pull safety**: a receivable with payments not yet accepted keeps its local balance (the
  server copy does not include them). Discarding a rejected payment gives the money back to
  its installments locally.
- **Screens**: visit COLLECTION panel (balance, documents with installments, payments of the
  visit; the outcome COLLECTED / PARTIALLY_COLLECTED is suggested from what is still overdue),
  `payment/new` (document, amount shortcuts, method with its fields, check date, receipt
  photo), `payment/[id]` (receipt, WhatsApp), customer detail balance, order detail plan and
  installments, and Más → "Mis cobros" (today / week / month, totals by method).

## Consequences

- The seller can run a collection route in airplane mode; the office receives each payment
  with the data needed to reconcile it.
- Supervisor web panel, background sync and push notifications remain for a later stage.
