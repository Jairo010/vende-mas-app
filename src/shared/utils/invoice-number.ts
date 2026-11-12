/**
 * Invoice numbers come from the server in the canonical form `001002-221` (API ADR 0028); this
 * prints them as on Ecuadorian invoices: `001-002-000000221`. Anything else is shown as is.
 * Same rule as the CRM.
 */
export function formatInvoiceNumber(invoiceNumber: string): string {
  const match = /^(\d{3})(\d{3})-(\d+)$/.exec(invoiceNumber);
  if (!match) return invoiceNumber;
  const [, establishment, point, sequential] = match;
  return `${establishment}-${point}-${(sequential ?? '').padStart(9, '0')}`;
}
