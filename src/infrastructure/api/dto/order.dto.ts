/** Wire format of the API sales module (`/api/v1/sales/orders`, also used by sync). */

export interface OrderItemResponseDto {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
  promotionName: string | null;
}

export interface OrderCustomerSummaryDto {
  id: string;
  identification: string | null;
  name: string;
}

export interface OrderResponseDto {
  id: string;
  orderNumber: string;
  userId: string;
  customerId: string;
  visitId?: string | null;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  estimatedDeliveryDate?: string | null;
  notes?: string | null;
  items: OrderItemResponseDto[];
  customer?: OrderCustomerSummaryDto | null;
  billingSyncStatus: string;
  externalId: string | null;
  invoiceNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceAdjustmentDto {
  productId: string;
  expectedUnitPrice: number;
  unitPrice: number;
}

/** `POST /sales/orders` (sync: ORDER CREATE). */
export interface CreateOrderRequestDto {
  id: string;
  customerId: string;
  visitId?: string;
  items: { productId: string; quantity: number; expectedUnitPrice?: number }[];
  estimatedDeliveryDate?: string;
  notes?: string;
}
