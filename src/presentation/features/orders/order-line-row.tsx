import { Pressable, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Stepper } from '@/presentation/components/ui/stepper';
import { es } from '@/shared/i18n/es';
import { formatCurrency } from '@/shared/utils/format-currency';
import { useThemeColors } from '@/theme';

export interface OrderLineRowProps {
  name: string;
  code: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  promotionName: string | null;
  /** Editable lines (review step) show a stepper and a remove button. */
  onChangeQuantity?: (quantity: number) => void;
  /** Shown instead of the amounts when the product can no longer be ordered. */
  warning?: string | null;
  testID?: string;
}

/** One line of an order: quantity x unit price, promotion discount and line total. */
export function OrderLineRow({
  name,
  code,
  quantity,
  unitPrice,
  discount,
  totalPrice,
  promotionName,
  onChangeQuantity,
  warning,
  testID,
}: OrderLineRowProps) {
  const colors = useThemeColors();

  return (
    <View testID={testID} className="px-4 py-3">
      <View className="flex-row items-start">
        <View className="mr-3 flex-1">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
            {name}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {code} · {quantity} x {formatCurrency(unitPrice)}
          </Text>
          {discount > 0 ? (
            <Text className="mt-0.5 text-xs text-success">
              {es.orders.discount}
              {promotionName ? ` ${promotionName}` : ''}: -{formatCurrency(discount)}
            </Text>
          ) : null}
          {warning ? <Text className="mt-0.5 text-xs text-destructive">{warning}</Text> : null}
        </View>
        <Text className="text-sm font-bold text-foreground">{formatCurrency(totalPrice)}</Text>
      </View>

      {onChangeQuantity ? (
        <View className="mt-2 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={es.orders.cart.remove}
            hitSlop={8}
            onPress={() => onChangeQuantity(0)}
            className="flex-row items-center rounded-lg px-2 py-1 active:bg-muted"
          >
            <Trash2 size={14} color={colors.destructive} />
            <Text className="ml-1 text-xs font-medium text-destructive">
              {es.orders.cart.remove}
            </Text>
          </Pressable>
          <Stepper value={quantity} onChange={onChangeQuantity} min={0} />
        </View>
      ) : null}
    </View>
  );
}
