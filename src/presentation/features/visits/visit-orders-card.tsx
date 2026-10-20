import { Text, View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import type { OrderEntity } from '@/core/entities/order.entity';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';
import { OrderListItem } from '../orders/order-list-item';

export interface VisitOrdersCardProps {
  orders: readonly OrderEntity[];
  /** Omit to hide the "Armar pedido" button (closed visits). */
  onTakeOrder?: () => void;
  description?: string;
}

/** Orders taken in this visit, and the entry point to take a new one. */
export function VisitOrdersCard({ orders, onTakeOrder, description }: VisitOrdersCardProps) {
  const colors = useThemeColors();

  return (
    <Card className="overflow-hidden p-0">
      <View className="p-4">
        <Text className="text-base font-semibold text-foreground">
          {orders.length > 0 ? es.visits.order.linked : es.visits.order.title}
        </Text>
        <Text className="mt-1 text-xs text-muted-foreground">
          {orders.length > 0
            ? `${orders.length} ${es.tabs.orders.toLowerCase()}`
            : (description ?? es.visits.order.none)}
        </Text>
      </View>

      {orders.map((order) => (
        <View key={order.id} className="border-t border-border">
          <OrderListItem order={order} />
        </View>
      ))}

      {onTakeOrder ? (
        <View className="border-t border-border p-4">
          <Button
            testID="visit-take-order"
            variant="secondary"
            leftIcon={<ShoppingCart size={16} color={colors.secondaryForeground} />}
            onPress={onTakeOrder}
          >
            {es.visits.actions.takeOrder}
          </Button>
        </View>
      ) : null}
    </Card>
  );
}
