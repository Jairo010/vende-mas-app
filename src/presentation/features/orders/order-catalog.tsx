import { useMemo, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { History, PackageSearch, Repeat, Search } from 'lucide-react-native';
import { useCartProducts } from '@/application/hooks/catalog/use-cart-products';
import { useProducts } from '@/application/hooks/catalog/use-products';
import { useCustomerProducts } from '@/application/hooks/customers/use-customer-products';
import type { ProductEntity } from '@/core/entities/product.entity';
import type { Promotion } from '@/core/types/catalog.types';
import type { CustomerProduct } from '@/core/types/customer-product.types';
import { bestPromotion } from '@/core/value-objects/order-pricing';
import { notify } from '@/presentation/components/feedback/toast';
import { Button } from '@/presentation/components/ui/button';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Input } from '@/presentation/components/ui/input';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { es } from '@/shared/i18n/es';
import { todayKey, toDateKey } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';
import { ProductRow } from './product-row';
import { QuantitySheet } from './quantity-sheet';

export interface OrderCatalogProps {
  quantities: Readonly<Record<string, number>>;
  onChangeQuantity: (product: ProductEntity, quantity: number) => void;
  promotions: readonly Promotion[];
  /** The order's customer: what it usually buys is offered first. */
  customerId?: string;
  customerName?: string;
  /** Space for the sticky cart footer. */
  bottomInset?: number;
}

const DAY_MS = 86_400_000;

/** Whole days between the purchase day and today (local). */
function daysSince(isoInstant: string): number {
  const days = (Date.parse(todayKey()) - Date.parse(toDateKey(isoInstant))) / DAY_MS;
  return Math.max(0, Math.round(days));
}

interface CatalogSection {
  key: 'history' | 'catalog';
  data: ProductEntity[];
}

/**
 * Offline catalog (ADR 0012): what the customer usually buys first, with "repeat last
 * purchase"; a search that understands how customers ask ("pastillas spark", "aceite total
 * 20w50"); one tap adds a product, a long press sets any quantity.
 */
export function OrderCatalog({
  quantities,
  onChangeQuantity,
  promotions,
  customerId,
  customerName,
  bottomInset = 0,
}: OrderCatalogProps) {
  const colors = useThemeColors();
  const t = es.orders.catalog;
  const [search, setSearch] = useState('');
  const [sheetProduct, setSheetProduct] = useState<ProductEntity | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const isSearching = debouncedSearch.trim() !== '';
  const { products, isLoading } = useProducts({ search: debouncedSearch });
  const { customerProducts } = useCustomerProducts(customerId);
  const historyIds = useMemo(
    () => customerProducts.map((row) => row.productId),
    [customerProducts],
  );
  const { products: historyProducts } = useCartProducts(historyIds);
  const now = new Date();

  const historyByProduct = useMemo(
    () => new Map<string, CustomerProduct>(customerProducts.map((row) => [row.productId, row])),
    [customerProducts],
  );
  // In the order of the history (most bought first), only what can still be sold.
  const history = useMemo(() => {
    const byId = new Map(historyProducts.map((product) => [product.id, product]));
    return historyIds.flatMap((id) => {
      const product = byId.get(id);
      return product?.isActive ? [product] : [];
    });
  }, [historyIds, historyProducts]);
  const lastPurchase = history.filter(
    (product) => historyByProduct.get(product.id)?.inLastPurchase,
  );

  // Empty sections are left out: the list then shows its empty state.
  const sections: CatalogSection[] = (
    isSearching
      ? [{ key: 'catalog' as const, data: products }]
      : [
          { key: 'history' as const, data: history },
          { key: 'catalog' as const, data: products },
        ]
  ).filter((section) => section.data.length > 0);

  const repeatLastPurchase = () => {
    for (const product of lastPurchase) {
      onChangeQuantity(product, historyByProduct.get(product.id)?.lastQuantity ?? 1);
    }
    notify.success(t.history.repeated(lastPurchase.length));
  };

  const hintFor = (product: ProductEntity): string | undefined => {
    const row = historyByProduct.get(product.id);
    return row ? t.history.hint(row.lastQuantity, daysSince(row.lastPurchasedAt)) : undefined;
  };

  return (
    <View className="flex-1">
      <View className="gap-3 px-4 pt-4">
        <Input
          testID="order-catalog-search"
          value={search}
          onChangeText={setSearch}
          placeholder={t.searchPlaceholder}
          leftIcon={<Search size={18} color={colors.mutedForeground} />}
          showClearButton
          onClear={() => setSearch('')}
          autoCorrect={false}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(product, index) => `${product.id}-${index}`}
        className="mt-3"
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomInset }}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        renderSectionHeader={({ section }) =>
          section.key === 'history' ? (
            <View className="gap-3 px-4 pb-3 pt-1">
              <View className="flex-row items-center gap-2">
                <History size={16} color={colors.primary} />
                <Text className="flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>
                  {t.history.title(customerName)}
                </Text>
              </View>
              {lastPurchase.length > 0 ? (
                <Button
                  testID="order-repeat-last-purchase"
                  variant="outline"
                  leftIcon={<Repeat size={16} color={colors.foreground} />}
                  onPress={repeatLastPurchase}
                >
                  {t.history.repeat(lastPurchase.length)}
                </Button>
              ) : null}
            </View>
          ) : !isSearching && history.length > 0 ? (
            <Text className="px-4 pb-2 pt-5 text-sm font-semibold text-foreground">
              {t.allProducts}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const quantity = quantities[item.id] ?? 0;
          const row = historyByProduct.get(item.id);
          return (
            <ProductRow
              product={item}
              quantity={quantity}
              onChangeQuantity={(next) => onChangeQuantity(item, next)}
              promotion={bestPromotion(item, Math.max(quantity, 1), promotions, now)}
              suggestedQuantity={row?.lastQuantity}
              hint={hintFor(item)}
              onOpenQuantity={() => setSheetProduct(item)}
            />
          );
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={<PackageSearch size={32} color={colors.mutedForeground} />}
              title={isSearching ? es.customers.noMatchesTitle : t.emptyTitle}
              description={isSearching ? t.noMatches : t.emptyDescription}
            />
          )
        }
      />

      <QuantitySheet
        product={sheetProduct}
        quantity={sheetProduct ? (quantities[sheetProduct.id] ?? 0) : 0}
        suggestedQuantity={
          sheetProduct ? historyByProduct.get(sheetProduct.id)?.lastQuantity : undefined
        }
        onClose={() => setSheetProduct(null)}
        onConfirm={(quantity) => {
          if (sheetProduct) onChangeQuantity(sheetProduct, quantity);
        }}
      />
    </View>
  );
}
