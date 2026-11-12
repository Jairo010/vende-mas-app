# 0016. Invoiced orders on the phone

- **Status**: Accepted
- **Date**: 2026-11-11
- **Related**: API ADR 0028 (manual invoicing), API ADR 0041 (invoice replacement and history).

---

## Context

- The office invoices the sales taken in the app in the accounting system and types the invoice
  number in the CRM. If an invoice is voided, it puts the new number on the same sale.
- Sellers want to know which of their sales are already invoiced. The phone kept the number but
  not the date, and it showed the number in its stored form (`001002-221`).

## Decision

- Orders keep `invoiced_at` too (Drizzle migration `0008_order_invoiced_at`), filled by the sync
  pull. Registering or replacing an invoice changes the order's `updatedAt` on the server, so
  the next pull brings the new number.
- `OrderEntity.invoiceState()`: `INVOICED` with a number, `PENDING` without one, and nothing for
  drafts, cancelled orders and orders the server has not accepted yet.
- The order list and the order screen show a "Facturada" or "Por facturar" badge next to the
  delivery status (theme variants, no new colors). The order screen prints the number the way
  invoices do (`001-002-000000221`, `formatInvoiceNumber`, same rule as the CRM) with its date.
- The invoice history (voided numbers) stays in the CRM: the seller only needs the invoice in
  force.

## Consequences

- An order created on the phone shows its badge once it is synced.
- Older servers that do not send `invoicedAt` still work (the date is just not shown).
