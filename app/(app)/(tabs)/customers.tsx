import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Users } from 'lucide-react-native';
import { useCustomers } from '@/application/hooks/customers/use-customers';
import { useSyncNow } from '@/application/hooks/sync/use-sync-now';
import type { CustomerStatus } from '@/core/types/customer.types';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { OfflineBanner } from '@/presentation/components/feedback/offline-banner';
import { Chip } from '@/presentation/components/ui/chip';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Input } from '@/presentation/components/ui/input';
import { CustomerListItem } from '@/presentation/features/customers/customer-list-item';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

type StatusFilter = CustomerStatus | 'ALL';

const FILTERS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: es.customers.filterAll },
  { value: 'PROSPECT', label: es.customers.statuses.PROSPECT },
  { value: 'ACTIVE', label: es.customers.statuses.ACTIVE },
];

export default function CustomersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const debouncedSearch = useDebouncedValue(search);
  const { customers, isLoading } = useCustomers({
    search: debouncedSearch,
    status: status === 'ALL' ? undefined : status,
  });
  const { syncNow, isSyncing } = useSyncNow();
  const isFiltering = Boolean(debouncedSearch) || status !== 'ALL';

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={es.customers.title} />
      <OfflineBanner />

      <View className="gap-3 px-4 pt-4">
        <Input
          testID="customers-search"
          value={search}
          onChangeText={setSearch}
          placeholder={es.customers.searchPlaceholder}
          leftIcon={<Search size={18} color={colors.mutedForeground} />}
          showClearButton
          onClear={() => setSearch('')}
          autoCorrect={false}
        />
        <View className="flex-row gap-2">
          {FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              testID={`customers-filter-${filter.value}`}
              label={filter.label}
              selected={status === filter.value}
              onPress={() => setStatus(filter.value)}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(customer) => customer.id}
        className="mt-3"
        contentContainerStyle={{ flexGrow: 1 }}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        renderItem={({ item }) => (
          <CustomerListItem
            customer={item}
            onPress={(customer) =>
              router.push({ pathname: '/(app)/customer/[id]', params: { id: customer.id } })
            }
          />
        )}
        keyboardShouldPersistTaps="handled"
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
              icon={<Users size={32} color={colors.mutedForeground} />}
              title={isFiltering ? es.customers.noMatchesTitle : es.customers.emptyTitle}
              description={
                isFiltering ? es.customers.noMatchesDescription : es.customers.emptyDescription
              }
            />
          )
        }
      />
    </View>
  );
}
