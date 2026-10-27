import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { OrderEntity } from '@/core/entities/order.entity';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { Badge } from '@/presentation/components/ui/badge';
import { Card } from '@/presentation/components/ui/card';
import { ListItem } from '@/presentation/components/ui/list-item';
import { es } from '@/shared/i18n/es';
import { formatVisitSchedule } from '../visits/visit-schedule';
import { OrderListItem } from '../orders/order-list-item';
import { VISIT_STATUS_VISUALS, VISIT_TYPE_VISUALS } from '../visits/visit-visuals';

export interface CustomerHistoryProps {
  visits: readonly VisitEntity[];
  orders: readonly OrderEntity[];
  onOpenVisit: (visit: VisitEntity) => void;
  onOpenOrder: (order: OrderEntity) => void;
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string | null;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <Text className="px-4 pb-2 pt-4 text-base font-semibold text-foreground">{title}</Text>
      {empty ? <Text className="px-4 pb-4 text-sm text-muted-foreground">{empty}</Text> : children}
    </Card>
  );
}

/** Visits (most recent first) and orders of a customer. */
export function CustomerHistory({
  visits,
  orders,
  onOpenVisit,
  onOpenOrder,
}: CustomerHistoryProps) {
  return (
    <View className="gap-4">
      <Section
        title={es.customers.history.visits}
        empty={visits.length === 0 ? es.customers.history.noVisits : null}
      >
        {visits.map((visit) => {
          const status = VISIT_STATUS_VISUALS[visit.status];
          return (
            <View key={visit.id} className="border-t border-border">
              <ListItem
                testID={`customer-visit-${visit.id}`}
                title={VISIT_TYPE_VISUALS[visit.type].label}
                subtitle={formatVisitSchedule(visit)}
                caption={visit.outcome ? es.visits.outcomes[visit.outcome] : null}
                trailing={<Badge size="sm" variant={status.badgeVariant} label={status.label} />}
                onPress={() => onOpenVisit(visit)}
              />
            </View>
          );
        })}
      </Section>

      <Section
        title={es.customers.history.orders}
        empty={orders.length === 0 ? es.customers.history.noOrders : null}
      >
        {orders.map((order) => (
          <View key={order.id} className="border-t border-border">
            <OrderListItem order={order} onPress={onOpenOrder} />
          </View>
        ))}
      </Section>
    </View>
  );
}
