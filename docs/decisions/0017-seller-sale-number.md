# 0017. The seller's sale number on the phone

- **Status**: Accepted
- **Date**: 2026-11-11
- **Related**: API ADR 0042 (seller order number), API ADR 0043 (sale email with its PDF),
  ADR 0016 (invoiced orders).

---

## Context

- Every sale now has the seller's own number (`JP-00015`): it is the one on the PDF and the email
  the customer receives. The company number (`ORD-000231`) stays as the internal reference.
- The seller shares the sale on WhatsApp from the phone right after taking it; the receipt must
  show the same number the customer gets by email.

## Decision

- Orders keep `seller_order_number` (Drizzle migration `0009_order_seller_number`), filled by the
  sync pull and, right away, by the result of the `ORDER_CREATE` push together with the company
  number (`OrderMapper.toNumbers`), so the receipt does not wait for the next pull.
- `OrderEntity.saleNumber()`: the seller's number, else the company one, null before syncing
  ("Pendiente de número").
- The order list, the order screen title and number, and the WhatsApp receipt use it; the order
  screen shows the company number as "Referencia interna".

## Consequences

- Older servers without the seller number keep showing the company number.
- Sales taken offline show their number once the phone syncs.
