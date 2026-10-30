/** A product a customer usually buys (last 12 months, API ADR 0031). */
export interface CustomerProduct {
  id: string;
  customerId: string;
  productId: string;
  /** Purchases that included it. */
  purchaseCount: number;
  totalQuantity: number;
  /** Quantity of its latest purchase: what the seller offers by default. */
  lastQuantity: number;
  /** ISO 8601. */
  lastPurchasedAt: string;
  /** Part of the customer's latest purchase ("repeat last purchase"). */
  inLastPurchase: boolean;
}
