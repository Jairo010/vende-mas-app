import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Search, Users } from 'lucide-react-native';
import { useCustomers } from '@/application/hooks/customers/use-customers';
import type { CustomerEntity } from '@/core/entities/customer.entity';
import { AlertBanner } from '@/presentation/components/feedback/alert-banner';
import { notify } from '@/presentation/components/feedback/toast';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Input } from '@/presentation/components/ui/input';
import {
  CustomerLookupCard,
  looksLikeIdentification,
} from '@/presentation/features/customers/customer-lookup-card';
import { CustomerListItem } from '@/presentation/features/customers/customer-list-item';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

const SEARCH_LIMIT = 50;

export interface OrderCustomerPickerProps {
  onPick: (customer: CustomerEntity) => void;
}

/** First step of an order taken outside a visit: an ACTIVE customer. */
export function OrderCustomerPicker({ onPick }: OrderCustomerPickerProps) {
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const { customers, isLoading } = useCustomers({
    search: debouncedSearch,
    status: 'ACTIVE',
    limit: SEARCH_LIMIT,
  });

  const pick = (customer: CustomerEntity) => {
    if (customer.canTakeOrders()) onPick(customer);
    else notify.warning(es.orders.onlyActive);
  };

  return (
    <View className="flex-1">
      <View className="gap-3 p-4">
        <AlertBanner
          variant="info"
          title={es.orders.chooseCustomer}
          message={es.orders.onlyActive}
        />
        <Input
          testID="order-customer-search"
          value={search}
          onChangeText={setSearch}
          placeholder={es.customers.searchPlaceholder}
          leftIcon={<Search size={18} color={colors.mutedForeground} />}
          showClearButton
          onClear={() => setSearch('')}
          autoCorrect={false}
        />
      </View>
      <FlatList
        data={customers}
        keyExtractor={(customer) => customer.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        renderItem={({ item }) => <CustomerListItem customer={item} onPress={pick} />}
        ListEmptyComponent={
          isLoading ? null : looksLikeIdentification(debouncedSearch) ? (
            <View className="px-4">
              <CustomerLookupCard identification={debouncedSearch} onFound={pick} />
            </View>
          ) : (
            <EmptyState
              icon={<Users size={32} color={colors.mutedForeground} />}
              title={es.customers.noMatchesTitle}
              description={es.customers.noMatchesDescription}
            />
          )
        }
      />
    </View>
  );
}
