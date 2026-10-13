import { Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import type { ProductEntity } from '@/core/entities/product.entity';
import type { AppliedPromotion } from '@/core/value-objects/order-pricing';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Stepper } from '@/presentation/components/ui/stepper';
import { es } from '@/shared/i18n/es';
import { formatCurrency } from '@/shared/utils/format-currency';
import { useThemeColors } from '@/theme';

export interface ProductRowProps {
  product: ProductEntity;
  quantity: number;
  onChangeQuantity: (quantity: number) => void;
  /** Best promotion for the current (or first) unit, if any. */
  promotion: AppliedPromotion | null;
}

/** Catalog line: name, code/brand, price with and without VAT, stock and quantity. */
export function ProductRow({ product, quantity, onChangeQuantity, promotion }: ProductRowProps) {
  const colors = useThemeColors();
  const overStock = quantity > product.stockQuantity;

  return (
    <View testID={`product-row-${product.id}`} className="flex-row items-center bg-card px-4 py-3">
      <View className="mr-3 flex-1">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
          {product.code}
          {product.brand ? ` · ${product.brand}` : ''} · {product.unitOfMeasure}
        </Text>
        <View className="mt-1.5 flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <Text className="text-sm font-bold text-foreground">
            {formatCurrency(product.basePrice)}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {formatCurrency(product.priceWithTax)} {es.orders.catalog.withTax}
          </Text>
          {promotion ? (
            <Badge
              size="sm"
              variant="success"
              label={`${es.orders.catalog.promotion} -${formatCurrency(promotion.unitDiscount)}`}
            />
          ) : null}
        </View>
        <Text
          className={`mt-1 text-xs ${
            product.isOutOfStock() || overStock ? 'text-warning' : 'text-muted-foreground'
          }`}
        >
          {product.isOutOfStock()
            ? es.orders.catalog.outOfStock
            : `${es.orders.catalog.stock}: ${product.stockQuantity}`}
          {overStock && !product.isOutOfStock() ? ` · ${es.orders.cart.overStock}` : ''}
        </Text>
      </View>

      {quantity > 0 ? (
        <Stepper
          testID={`product-stepper-${product.id}`}
          value={quantity}
          onChange={onChangeQuantity}
          min={0}
        />
      ) : (
        <Button
          testID={`product-add-${product.id}`}
          size="sm"
          variant="outline"
          leftIcon={<Plus size={14} color={colors.primary} />}
          onPress={() => onChangeQuantity(1)}
        >
          {es.orders.catalog.add}
        </Button>
      )}
    </View>
  );
}
