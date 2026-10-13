import { FlatList, RefreshControl, View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { useOrders } from '@/application/hooks/orders/use-orders';
import { useSyncNow } from '@/application/hooks/sync/use-sync-now';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { OfflineBanner } from '@/presentation/components/feedback/offline-banner';
import { SyncStatusPill } from '@/presentation/components/feedback/sync-status-pill';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { OrderListItem } from '@/presentation/features/orders/order-list-item';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

export default function OrdersScreen() {
  const colors = useThemeColors();
  const { orders, isLoading } = useOrders();
  const { syncNow, isSyncing } = useSyncNow();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={es.orders.title} rightElement={<SyncStatusPill />} />
      <OfflineBanner />

      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerStyle={{ flexGrow: 1 }}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        renderItem={({ item }) => <OrderListItem order={item} />}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={() => void syncNow()}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={<ShoppingCart size={32} color={colors.mutedForeground} />}
              title={es.orders.emptyTitle}
              description={es.orders.emptyDescription}
            />
          )
        }
      />
    </View>
  );
}
