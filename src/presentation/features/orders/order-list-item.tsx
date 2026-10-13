import { Text, View } from 'react-native';
import type { OrderEntity } from '@/core/entities/order.entity';
import { Badge } from '@/presentation/components/ui/badge';
import { ListItem } from '@/presentation/components/ui/list-item';
import { es } from '@/shared/i18n/es';
import { formatDateTime } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';

export interface OrderListItemProps {
  order: OrderEntity;
  onPress?: (order: OrderEntity) => void;
}

export function OrderListItem({ order, onPress }: OrderListItemProps) {
  return (
    <ListItem
      testID={`order-item-${order.id}`}
      title={order.customerName ?? '—'}
      subtitle={`${order.itemCount()} ${es.orders.items} · ${formatDateTime(order.createdAt)}`}
      leading={
        <View className="items-start">
          {order.orderNumber ? (
            <Text className="text-xs font-bold text-foreground">{order.orderNumber}</Text>
          ) : (
            <Badge size="sm" variant="warning" label={es.orders.pendingNumber} />
          )}
        </View>
      }
      trailing={
        <Text className="text-base font-bold text-foreground">{formatCurrency(order.total)}</Text>
      }
      showChevron={Boolean(onPress)}
      onPress={onPress ? () => onPress(order) : undefined}
    />
  );
}
