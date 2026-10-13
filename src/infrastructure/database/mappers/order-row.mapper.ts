import { OrderEntity, type OrderItem } from '@/core/entities/order.entity';
import type { BillingSyncStatus } from '@/core/types/customer.types';
import type { OrderStatus } from '@/core/types/order.types';
import type { LocalSyncStatus } from '@/core/types/visit.types';
import type { orderItems, orders } from '../schema';

export type OrderRow = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
export type OrderItemRow = typeof orderItems.$inferSelect;

export class OrderRowMapper {
  static toDomain(row: OrderRow, items: OrderItemRow[]): OrderEntity {
    return OrderEntity.create({
      id: row.id,
      orderNumber: row.orderNumber,
      customerId: row.customerId,
      customerName: row.customerName,
      visitId: row.visitId,
      sellerId: row.sellerId,
      status: row.status as OrderStatus,
      subtotal: row.subtotal,
      discountTotal: row.discountTotal,
      taxTotal: row.taxTotal,
      total: row.total,
      estimatedDeliveryDate: row.estimatedDeliveryDate,
      notes: row.notes,
      billingSyncStatus: row.billingSyncStatus as BillingSyncStatus,
      invoiceNumber: row.invoiceNumber,
      priceAdjustments: row.priceAdjustments ?? [],
      items: items.map(OrderRowMapper.toItem),
      syncStatus: row.syncStatus as LocalSyncStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toItem(row: OrderItemRow): OrderItem {
    return {
      id: row.id,
      productId: row.productId,
      productCode: row.productCode,
      productName: row.productName,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      discount: row.discount,
      totalPrice: row.totalPrice,
      taxRate: row.taxRate,
      taxAmount: row.taxAmount,
      promotionName: row.promotionName,
    };
  }

  /** Server columns only: price adjustments and sync status are local bookkeeping. */
  static toServerColumns(entity: OrderEntity): OrderInsert {
    return {
      id: entity.id,
      orderNumber: entity.orderNumber,
      customerId: entity.customerId,
      customerName: entity.customerName,
      visitId: entity.visitId,
      sellerId: entity.sellerId,
      status: entity.status,
      subtotal: entity.subtotal,
      discountTotal: entity.discountTotal,
      taxTotal: entity.taxTotal,
      total: entity.total,
      estimatedDeliveryDate: entity.estimatedDeliveryDate,
      notes: entity.notes,
      billingSyncStatus: entity.billingSyncStatus,
      invoiceNumber: entity.invoiceNumber,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toItemRows(entity: OrderEntity): OrderItemRow[] {
    return entity.items.map((item) => ({ ...item, orderId: entity.id }));
  }
}
