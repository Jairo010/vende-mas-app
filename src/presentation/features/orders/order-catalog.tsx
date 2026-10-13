import { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { PackageSearch, Search } from 'lucide-react-native';
import { useCategories } from '@/application/hooks/catalog/use-categories';
import { useProducts } from '@/application/hooks/catalog/use-products';
import type { ProductEntity } from '@/core/entities/product.entity';
import type { Promotion } from '@/core/types/catalog.types';
import { bestPromotion } from '@/core/value-objects/order-pricing';
import { Chip } from '@/presentation/components/ui/chip';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Input } from '@/presentation/components/ui/input';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';
import { ProductRow } from './product-row';

export interface OrderCatalogProps {
  quantities: Readonly<Record<string, number>>;
  onChangeQuantity: (product: ProductEntity, quantity: number) => void;
  promotions: readonly Promotion[];
  /** Space for the sticky cart footer. */
  bottomInset?: number;
}

/** Offline catalog: search by name/code/brand, category chips and a quantity per product. */
export function OrderCatalog({
  quantities,
  onChangeQuantity,
  promotions,
  bottomInset = 0,
}: OrderCatalogProps) {
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search);
  const { categories } = useCategories();
  const { products, isLoading } = useProducts({ search: debouncedSearch, categoryId });
  const now = new Date();
  const isFiltering = Boolean(debouncedSearch) || Boolean(categoryId);

  return (
    <View className="flex-1">
      <View className="gap-3 px-4 pt-4">
        <Input
          testID="order-catalog-search"
          value={search}
          onChangeText={setSearch}
          placeholder={es.orders.catalog.searchPlaceholder}
          leftIcon={<Search size={18} color={colors.mutedForeground} />}
          showClearButton
          onClear={() => setSearch('')}
          autoCorrect={false}
        />
        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-row gap-2 pb-1">
              <Chip
                testID="order-category-all"
                label={es.orders.catalog.allCategories}
                selected={!categoryId}
                onPress={() => setCategoryId(undefined)}
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  testID={`order-category-${category.id}`}
                  label={category.name}
                  selected={categoryId === category.id}
                  onPress={() => setCategoryId(category.id)}
                />
              ))}
            </View>
          </ScrollView>
        ) : null}
      </View>

      <FlatList
        data={products}
        keyExtractor={(product) => product.id}
        className="mt-3"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomInset }}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        renderItem={({ item }) => {
          const quantity = quantities[item.id] ?? 0;
          return (
            <ProductRow
              product={item}
              quantity={quantity}
              onChangeQuantity={(next) => onChangeQuantity(item, next)}
              promotion={bestPromotion(item, Math.max(quantity, 1), promotions, now)}
            />
          );
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={<PackageSearch size={32} color={colors.mutedForeground} />}
              title={isFiltering ? es.customers.noMatchesTitle : es.orders.catalog.emptyTitle}
              description={
                isFiltering ? es.orders.catalog.noMatches : es.orders.catalog.emptyDescription
              }
            />
          )
        }
      />
    </View>
  );
}
