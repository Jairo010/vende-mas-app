import type { Promotion } from '../types/catalog.types';
import { calculateOrderTotals, roundMoney, type OrderTotals } from './money';

/** What pricing needs to know about a product. */
export interface PricingProduct {
  id: string;
  categoryId: string;
  /** Unit price without VAT (USD). */
  basePrice: number;
  taxRate: number;
}

export interface AppliedPromotion {
  id: string;
  name: string;
  /** Discount per unit (USD). */
  unitDiscount: number;
}

export interface PricedOrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  /** Discount of the whole line (USD). */
  discount: number;
  /** Line amount after discount, before VAT. */
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
  promotion: AppliedPromotion | null;
}

export interface PricedOrder {
  lines: PricedOrderLine[];
  totals: OrderTotals;
}

function isValidAt(promotion: Promotion, at: Date): boolean {
  const instant = at.getTime();
  return (
    instant >= new Date(promotion.startsAt).getTime() &&
    instant <= new Date(promotion.endsAt).getTime()
  );
}

function appliesTo(promotion: Promotion, product: PricingProduct): boolean {
  switch (promotion.targetType) {
    case 'GLOBAL':
      return true;
    case 'CATEGORY':
      return promotion.targetCategoryId === product.categoryId;
    case 'PRODUCT':
      return promotion.targetProductIds.includes(product.id);
  }
}

function unitDiscountOf(promotion: Promotion, basePrice: number): number {
  if (basePrice <= 0) return 0;
  if (promotion.discountType === 'PERCENTAGE') {
    return roundMoney(basePrice * (promotion.discountValue / 100));
  }
  return Math.min(basePrice, promotion.discountValue);
}

/**
 * Best promotion for a line: valid now, targeting the product (globally, by category or by
 * product), reaching its minimum quantity, with the largest unit discount. Same rule as the
 * API pricing engine, so the estimate the seller shows matches the official order.
 */
export function bestPromotion(
  product: PricingProduct,
  quantity: number,
  promotions: readonly Promotion[],
  at: Date,
): AppliedPromotion | null {
  let best: AppliedPromotion | null = null;
  for (const promotion of promotions) {
    if (!isValidAt(promotion, at) || !appliesTo(promotion, product)) continue;
    if (quantity < promotion.minQuantity) continue;
    const unitDiscount = unitDiscountOf(promotion, product.basePrice);
    if (unitDiscount > (best?.unitDiscount ?? 0)) {
      best = { id: promotion.id, name: promotion.name, unitDiscount };
    }
  }
  return best;
}

export function priceOrderLine(
  product: PricingProduct,
  quantity: number,
  promotions: readonly Promotion[],
  at: Date,
): PricedOrderLine {
  const promotion = bestPromotion(product, quantity, promotions, at);
  const discount = promotion ? roundMoney(promotion.unitDiscount * quantity) : 0;
  const totalPrice = Math.max(0, roundMoney(product.basePrice * quantity - discount));
  return {
    productId: product.id,
    quantity,
    unitPrice: product.basePrice,
    discount,
    totalPrice,
    taxRate: product.taxRate,
    taxAmount: roundMoney(totalPrice * product.taxRate),
    promotion,
  };
}

/** Lines and totals of an order (estimate: the server recalculates and its numbers win). */
export function priceOrder(
  items: readonly { product: PricingProduct; quantity: number }[],
  promotions: readonly Promotion[],
  at: Date,
): PricedOrder {
  const lines = items.map(({ product, quantity }) =>
    priceOrderLine(product, quantity, promotions, at),
  );
  return { lines, totals: calculateOrderTotals(lines) };
}
