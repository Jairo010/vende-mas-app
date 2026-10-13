export const ORDER_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderFilter {
  customerId?: string;
  visitId?: string;
  limit?: number;
}

export interface CreateOrderLineInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerId: string;
  visitId?: string;
  items: CreateOrderLineInput[];
  /** ISO instant; the server defaults it to one week after the order. */
  estimatedDeliveryDate?: string;
  notes?: string;
}

export interface PriceAdjustment {
  productId: string;
  /** Price the app displayed. */
  expectedUnitPrice: number;
  /** Price applied by the server. */
  unitPrice: number;
}
