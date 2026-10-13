/** Rounds a USD amount to cents (half away from zero), like the API pricing engine. */
export function roundMoney(amount: number): number {
  return (Math.sign(amount) * Math.round((Math.abs(amount) + Number.EPSILON) * 100)) / 100;
}

export interface OrderLineAmounts {
  /** Line amount after discount, before VAT. */
  totalPrice: number;
  taxAmount: number;
}

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
}

/** Line amounts for a quantity at a unit price (without VAT) and a VAT rate. */
export function calculateOrderLine(
  quantity: number,
  unitPrice: number,
  taxRate: number,
  discount = 0,
): OrderLineAmounts {
  const totalPrice = roundMoney(quantity * unitPrice - discount);
  return { totalPrice, taxAmount: roundMoney(totalPrice * taxRate) };
}

/**
 * Order totals from its lines. Local estimate only: the server recalculates prices,
 * promotions and VAT, and its numbers replace these after the sync.
 */
export function calculateOrderTotals(
  lines: readonly { quantity: number; unitPrice: number; discount: number; taxAmount: number }[],
): OrderTotals {
  const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0));
  const discountTotal = roundMoney(lines.reduce((sum, l) => sum + l.discount, 0));
  const taxTotal = roundMoney(lines.reduce((sum, l) => sum + l.taxAmount, 0));
  return {
    subtotal,
    discountTotal,
    taxTotal,
    total: roundMoney(subtotal - discountTotal + taxTotal),
  };
}
