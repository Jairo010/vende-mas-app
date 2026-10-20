import type { OrderEntity } from '@/core/entities/order.entity';
import type { OrderStatus } from '@/core/types/order.types';
import type { BadgeProps } from '@/presentation/components/ui/badge';
import { es } from '@/shared/i18n/es';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

export const ORDER_STATUS_BADGES: Readonly<Record<OrderStatus, BadgeVariant>> = {
  DRAFT: 'default',
  CONFIRMED: 'info',
  PROCESSING: 'warning',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
};

/** Local replication state of an order, as a badge (null = synced, nothing to show). */
export function orderSyncBadge(
  order: OrderEntity,
): { label: string; variant: BadgeVariant } | null {
  if (order.syncStatus === 'REJECTED') return { label: es.orders.rejected, variant: 'destructive' };
  if (order.isPendingSync()) return { label: es.orders.pendingNumber, variant: 'warning' };
  return null;
}
