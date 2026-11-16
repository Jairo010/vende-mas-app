import { memo, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
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

/** Rows of the list: the two titles and the products under each. */
type CatalogItem =
  | { kind: 'history-header' }
  | { kind: 'catalog-header' }
  | { kind: 'product'; key: string; product: ProductEntity };

interface CatalogProductRowProps {
  product: ProductEntity;
  quantity: number;
  promotions: readonly Promotion[];
  /** When the cart is priced: fixed while the catalog is open, so rows do not re-price. */
  pricedAt: Date;
  /** What the customer bought of this product, if anything. */
  purchase?: CustomerProduct;
  onChangeQuantity: (product: ProductEntity, quantity: number) => void;
  onOpenQuantity: (product: ProductEntity) => void;
}

/**
 * A product of the list. Memoized: changing one quantity renders that row again, not the whole
 * list (ADR 0020).
 */
const CatalogProductRow = memo(function CatalogProductRow({
  product,
  quantity,
  promotions,
  pricedAt,
  purchase,
  onChangeQuantity,
  onOpenQuantity,
}: CatalogProductRowProps) {
  const promotion = useMemo(
    () => bestPromotion(product, Math.max(quantity, 1), promotions, pricedAt),
    [product, quantity, promotions, pricedAt],
  );

  return (
    <View className="border-b border-border">
      <ProductRow
        product={product}
        quantity={quantity}
        onChangeQuantity={(next) => onChangeQuantity(product, next)}
        promotion={promotion}
        suggestedQuantity={purchase?.lastQuantity}
        hint={
          purchase
            ? es.orders.catalog.history.hint(
                purchase.lastQuantity,
                daysSince(purchase.lastPurchasedAt),
              )
            : undefined
        }
        onOpenQuantity={() => onOpenQuantity(product)}
      />
    </View>
  );
});

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
  const [pricedAt] = useState(() => new Date());

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

  // What the customer buys first (not while searching), then the catalog.
  const items = useMemo<CatalogItem[]>(() => {
    const rows: CatalogItem[] = [];
    const showHistory = !isSearching && history.length > 0;
    if (showHistory) {
      rows.push({ kind: 'history-header' });
      for (const product of history) {
        rows.push({ kind: 'product', key: `history-${product.id}`, product });
      }
    }
    if (showHistory && products.length > 0) rows.push({ kind: 'catalog-header' });
    for (const product of products) rows.push({ kind: 'product', key: product.id, product });
    return rows;
  }, [isSearching, history, products]);

  const repeatLastPurchase = () => {
    for (const product of lastPurchase) {
      onChangeQuantity(product, historyByProduct.get(product.id)?.lastQuantity ?? 1);
    }
    notify.success(t.history.repeated(lastPurchase.length));
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
        <Text className="text-xs text-muted-foreground">{t.howTo}</Text>
      </View>

      <View className="mt-3 flex-1">
        <FlashList
          data={items}
          // Rows read the cart: they render again when a quantity changes.
          extraData={quantities}
          keyExtractor={(item) => (item.kind === 'product' ? item.key : item.kind)}
          getItemType={(item) => item.kind}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: bottomInset }}
          renderItem={({ item }) => {
            if (item.kind === 'history-header') {
              return (
                <View className="gap-3 px-4 pb-3 pt-1">
                  <View className="flex-row items-center gap-2">
                    <History size={16} color={colors.primary} />
                    <Text
                      className="flex-1 text-sm font-semibold text-foreground"
                      numberOfLines={1}
                    >
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
              );
            }
            if (item.kind === 'catalog-header') {
              return (
                <Text className="px-4 pb-2 pt-5 text-sm font-semibold text-foreground">
                  {t.allProducts}
                </Text>
              );
            }
            return (
              <CatalogProductRow
                product={item.product}
                quantity={quantities[item.product.id] ?? 0}
                promotions={promotions}
                pricedAt={pricedAt}
                purchase={historyByProduct.get(item.product.id)}
                onChangeQuantity={onChangeQuantity}
                onOpenQuantity={setSheetProduct}
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
      </View>

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
