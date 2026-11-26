# 0018. Payment balances on the phone and the next collection visit

- **Status**: Accepted
- **Date**: 2026-11-16
- **Related**: API ADR 0044 (collection notices and payment balances), app ADR 0006
  (collections), app ADR 0015 (mandatory next visit).

## Context

The customer now gets, for every payment, a receipt with the balance before, the payment and
the balance after (per installment, per invoice and for their whole debt). The seller must see
exactly the same on the phone, before collecting and afterwards, also offline. When a collection
leaves something owed, the next collection visit should be ready for the next installment.

## Decision

- `payments.balances` (JSON, drizzle 0010) stores `receivableBefore/After` and
  `customerBefore/After`; each allocation stores `balanceBefore`. The phone computes them when
  the payment is saved offline (same oldest-first rule as the server, `allocatePayment`); the
  server's copy replaces them on the next pull, as the rest of the payment.
- Payment form: a live preview ("Así queda con este abono") with the invoice before → payment →
  after, the split by installment and the customer's total debt (the open documents listed).
- Payment receipt screen and WhatsApp text: the same breakdown plus the installments still to
  pay with their due dates.
- Next visit (`suggestNextVisit`, `src/core/value-objects/next-visit.ts`): after a collection
  visit where the customer still owes, the mandatory next visit opens as a **collection** on the
  next installment due after today, moved to the customer's route day; one week ahead when only
  overdue installments are left. A collection that left nothing owed leads to an **order** visit.
  Other visits keep the previous rule. Nothing is created by the server: the seller still
  confirms the date (no duplicates with route visits).

## Consequences

- Older payments have no balances and show the amounts only.
- The customer total in the preview is the sum of the documents shown in the form (the
  customer's open ones); the server's figure replaces it after the sync.
