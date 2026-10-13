import type { BillingSyncStatus } from '../types/customer.types';
import type { OrderStatus, PriceAdjustment } from '../types/order.types';
import type { LocalSyncStatus } from '../types/visit.types';

export interface OrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  /** Unit price without VAT (USD). */
  unitPrice: number;
  discount: number;
  /** Line amount after discount, before VAT. */
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
  promotionName: string | null;
}

export interface OrderProps {
  id: string;
  orderNumber: string | null;
  customerId: string;
  customerName: string | null;
  visitId: string | null;
  sellerId: string;
  status: OrderStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  estimatedDeliveryDate: string | null;
  notes: string | null;
  billingSyncStatus: BillingSyncStatus;
  invoiceNumber: string | null;
  priceAdjustments: PriceAdjustment[];
  items: OrderItem[];
  syncStatus: LocalSyncStatus;
  createdAt: string;
  updatedAt: string;
}

/** Sales order. Created offline with estimated totals; the server sets the official ones. */
export class OrderEntity {
  public readonly id: string;
  public readonly orderNumber: string | null;
  public readonly customerId: string;
  public readonly customerName: string | null;
  public readonly visitId: string | null;
  public readonly sellerId: string;
  public readonly status: OrderStatus;
  public readonly subtotal: number;
  public readonly discountTotal: number;
  public readonly taxTotal: number;
  public readonly total: number;
  public readonly estimatedDeliveryDate: string | null;
  public readonly notes: string | null;
  public readonly billingSyncStatus: BillingSyncStatus;
  public readonly invoiceNumber: string | null;
  public readonly priceAdjustments: PriceAdjustment[];
  public readonly items: OrderItem[];
  public readonly syncStatus: LocalSyncStatus;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  constructor(props: OrderProps) {
    this.id = props.id;
    this.orderNumber = props.orderNumber;
    this.customerId = props.customerId;
    this.customerName = props.customerName;
    this.visitId = props.visitId;
    this.sellerId = props.sellerId;
    this.status = props.status;
    this.subtotal = props.subtotal;
    this.discountTotal = props.discountTotal;
    this.taxTotal = props.taxTotal;
    this.total = props.total;
    this.estimatedDeliveryDate = props.estimatedDeliveryDate;
    this.notes = props.notes;
    this.billingSyncStatus = props.billingSyncStatus;
    this.invoiceNumber = props.invoiceNumber;
    this.priceAdjustments = props.priceAdjustments;
    this.items = props.items;
    this.syncStatus = props.syncStatus;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: OrderProps): OrderEntity {
    return new OrderEntity(props);
  }

  /** Still waiting for the server (no official number yet). */
  public isPendingSync(): boolean {
    return this.orderNumber === null || this.syncStatus !== 'SYNCED';
  }

  public itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
