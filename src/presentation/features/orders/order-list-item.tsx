import { Text, View } from 'react-native';
import type { OrderEntity } from '@/core/entities/order.entity';
import { Badge } from '@/presentation/components/ui/badge';
import { ListItem } from '@/presentation/components/ui/list-item';
import { es } from '@/shared/i18n/es';
import { formatDateTime } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';
import { ORDER_STATUS_BADGES, orderSyncBadge } from './order-visuals';

export interface OrderListItemProps {
  order: OrderEntity;
  onPress?: (order: OrderEntity) => void;
}

/** Order row: official number (or "pending"), customer, items, date, status and total. */
export function OrderListItem({ order, onPress }: OrderListItemProps) {
  const syncBadge = orderSyncBadge(order);

  return (
    <ListItem
      testID={`order-item-${order.id}`}
      title={order.customerName ?? '—'}
      subtitle={`${order.orderNumber ?? es.orders.receipt.pendingNumber} · ${order.itemCount()} ${es.orders.items}`}
      caption={formatDateTime(order.createdAt)}
      trailing={
        <View className="items-end gap-1">
          <Text className="text-base font-bold text-foreground">{formatCurrency(order.total)}</Text>
          {syncBadge ? (
            <Badge size="sm" variant={syncBadge.variant} label={syncBadge.label} />
          ) : (
            <Badge
              size="sm"
              variant={ORDER_STATUS_BADGES[order.status]}
              label={es.orders.statuses[order.status]}
            />
          )}
        </View>
      }
      showChevron={Boolean(onPress)}
      onPress={onPress ? () => onPress(order) : undefined}
    />
  );
}
