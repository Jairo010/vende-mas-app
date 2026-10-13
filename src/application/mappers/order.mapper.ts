import { OrderEntity } from '@/core/entities/order.entity';
import type { BillingSyncStatus } from '@/core/types/customer.types';
import { ORDER_STATUSES, type PriceAdjustment } from '@/core/types/order.types';
import type { OrderResponseDto, PriceAdjustmentDto } from '@/infrastructure/api/dto/order.dto';
import { pickEnum } from './enum.mapper';

export class OrderMapper {
  static toDomain(dto: OrderResponseDto): OrderEntity {
    return OrderEntity.create({
      id: dto.id,
      orderNumber: dto.orderNumber,
      customerId: dto.customerId,
      customerName: dto.customer?.name ?? null,
      visitId: dto.visitId ?? null,
      sellerId: dto.userId,
      status: pickEnum(dto.status, ORDER_STATUSES, 'CONFIRMED'),
      subtotal: dto.subtotal,
      discountTotal: dto.discountTotal,
      taxTotal: dto.taxTotal,
      total: dto.total,
      estimatedDeliveryDate: dto.estimatedDeliveryDate ?? null,
      notes: dto.notes ?? null,
      billingSyncStatus: pickEnum<BillingSyncStatus>(
        dto.billingSyncStatus,
        ['NOT_REQUIRED', 'PENDING', 'EXPORTED', 'FAILED'],
        'NOT_REQUIRED',
      ),
      invoiceNumber: dto.invoiceNumber,
      priceAdjustments: [],
      items: dto.items.map((item) => ({ ...item })),
      syncStatus: 'SYNCED',
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /** `priceAdjustments` of an ORDER CREATE push result (`data`), if any. */
  static toPriceAdjustments(data: unknown): PriceAdjustment[] {
    if (!data || typeof data !== 'object' || !('priceAdjustments' in data)) return [];
    const list = (data as { priceAdjustments?: unknown }).priceAdjustments;
    if (!Array.isArray(list)) return [];
    return list
      .filter((item): item is PriceAdjustmentDto => typeof item?.productId === 'string')
      .map((item) => ({
        productId: item.productId,
        expectedUnitPrice: Number(item.expectedUnitPrice),
        unitPrice: Number(item.unitPrice),
      }));
  }
}
