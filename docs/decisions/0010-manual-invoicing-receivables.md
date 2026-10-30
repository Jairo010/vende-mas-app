# 0010. Receivables of manually invoiced orders

- **Status**: Accepted
- **Date**: 2026-10-28
- **Related**: ADR 0006 (collections); API ADR 0028 (manual invoicing).

---

## Context

Some companies invoice their orders by hand in their accounting system, and the office then types
the invoice number in the CRM. Until that happens an order is not a debt, so the seller must not
see anything to collect for it. Today the app opens the order's receivable on the device, offline,
as soon as the order is taken.

## Decision

- Every pull brings the company rule `settings.receivableOpensOn`: `ORDER` (default, and what
  servers before this change imply) or `INVOICE`. It is stored with the credit rules
  (`CollectionsSettings`, `collections-settings.store.ts`).
- With `INVOICE`, `SqliteOrderRepository.create` saves the order and queues it, but does not insert
  the local receivable or its installments.
- The receivable is opened by the server when the invoice is registered, in charge of the seller
  who took the order. It reaches the phone in a later pull, like any other receivable, and is
  collected with the usual flow.
- Nothing else changes: screens, sync protocol and the collection flow stay the same.

## Consequences

- With manual invoicing, a down payment cannot be collected at the moment the order is taken. It is
  collected once the order is invoiced.
- An order taken offline before the device learns the rule still opens its local receivable, as
  before. The server has none for it, so it never syncs, and it disappears from the device when it
  is replaced by the one the server sends after the invoice (same id: the order id).
