import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ShoppingCart } from 'lucide-react-native';
import { useOrders } from '@/application/hooks/orders/use-orders';
import { useSyncNow } from '@/application/hooks/sync/use-sync-now';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { OfflineBanner } from '@/presentation/components/feedback/offline-banner';
import { SyncStatusPill } from '@/presentation/components/feedback/sync-status-pill';
import { Chip } from '@/presentation/components/ui/chip';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { OrderListItem } from '@/presentation/features/orders/order-list-item';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

type OrdersFilter = 'ALL' | 'PENDING';

const FILTERS: readonly { value: OrdersFilter; label: string }[] = [
  { value: 'ALL', label: es.orders.filterAll },
  { value: 'PENDING', label: es.orders.filterPending },
];

/** Orders on the device, with their sync state (pending number, rejected). */
export default function OrdersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [filter, setFilter] = useState<OrdersFilter>('ALL');
  const { orders, isLoading } = useOrders();
  const { syncNow, isSyncing } = useSyncNow();

  const visible = useMemo(
    () => (filter === 'PENDING' ? orders.filter((order) => order.isPendingSync()) : orders),
    [orders, filter],
  );

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={es.orders.title}
        rightElement={<SyncStatusPill onPress={() => router.push('/(app)/sync')} />}
      />
      <OfflineBanner />

      <View className="flex-row gap-2 px-4 pt-4">
        {FILTERS.map((option) => (
          <Chip
            key={option.value}
            testID={`orders-filter-${option.value}`}
            label={option.label}
            selected={filter === option.value}
            onPress={() => setFilter(option.value)}
          />
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(order) => order.id}
        className="mt-3"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        renderItem={({ item }) => (
          <OrderListItem
            order={item}
            onPress={(order) =>
              router.push({ pathname: '/(app)/order/[id]', params: { id: order.id } })
            }
          />
        )}
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

      <Pressable
        testID="orders-new"
        accessibilityRole="button"
        accessibilityLabel={es.orders.newTitle}
        onPress={() => router.push('/(app)/order/new')}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg active:opacity-90"
      >
        <Plus size={26} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );
}
