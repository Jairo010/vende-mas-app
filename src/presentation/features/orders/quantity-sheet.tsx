import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { ProductEntity } from '@/core/entities/product.entity';
import { BottomSheet } from '@/presentation/components/ui/bottom-sheet';
import { Button } from '@/presentation/components/ui/button';
import { Chip } from '@/presentation/components/ui/chip';
import { es } from '@/shared/i18n/es';
import { FONT_FAMILY, useThemeColors } from '@/theme';

/** Quantities distributors sell most (units, pairs, half dozen, dozen). */
const QUICK_QUANTITIES = [1, 2, 4, 6, 10, 12] as const;
const MAX_QUANTITY = 9999;

export interface QuantitySheetProps {
  /** Null: closed. */
  product: ProductEntity | null;
  /** Quantity in the cart now (0: not in the cart). */
  quantity: number;
  /** What the customer bought last time, if anything. */
  suggestedQuantity?: number;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

/** Sets a quantity in one or two taps: common amounts or any number typed. */
export function QuantitySheet({
  product,
  quantity,
  suggestedQuantity,
  onClose,
  onConfirm,
}: QuantitySheetProps) {
  const colors = useThemeColors();
  const t = es.orders.quantity;
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (product) setTyped(quantity > 0 ? String(quantity) : '');
  }, [product, quantity]);

  const typedQuantity = Number.parseInt(typed, 10);
  const valid =
    Number.isInteger(typedQuantity) && typedQuantity > 0 && typedQuantity <= MAX_QUANTITY;
  const choose = (value: number) => {
    onConfirm(value);
    onClose();
  };

  return (
    <BottomSheet
      open={product !== null}
      onClose={onClose}
      title={t.title}
      description={product?.name}
      testID="quantity-sheet"
    >
      <View className="gap-4">
        <View className="flex-row flex-wrap gap-2">
          {QUICK_QUANTITIES.map((value) => (
            <Chip
              key={value}
              testID={`quantity-chip-${value}`}
              label={value === suggestedQuantity ? t.suggested(value) : String(value)}
              selected={value === quantity}
              onPress={() => choose(value)}
            />
          ))}
          {suggestedQuantity && !QUICK_QUANTITIES.some((value) => value === suggestedQuantity) ? (
            <Chip
              testID="quantity-chip-suggested"
              label={t.suggested(suggestedQuantity)}
              selected={suggestedQuantity === quantity}
              onPress={() => choose(suggestedQuantity)}
            />
          ) : null}
        </View>

        <View className="flex-row items-center gap-2">
          {/* Inside a sheet the keyboard handling needs gorhom's input, styled from the theme. */}
          <BottomSheetTextInput
            testID="quantity-input"
            value={typed}
            onChangeText={(text) => setTyped(text.replace(/\D/g, '').slice(0, 4))}
            placeholder={t.other}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={() => {
              if (valid) choose(typedQuantity);
            }}
            style={{
              flex: 1,
              height: 48,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              backgroundColor: colors.background,
              color: colors.foreground,
              fontFamily: FONT_FAMILY,
              fontSize: 16,
              paddingHorizontal: 14,
            }}
          />
          <Button testID="quantity-confirm" disabled={!valid} onPress={() => choose(typedQuantity)}>
            {t.confirm}
          </Button>
        </View>

        {quantity > 0 ? (
          <Button testID="quantity-remove" variant="ghost" onPress={() => choose(0)}>
            {t.remove}
          </Button>
        ) : null}
      </View>
    </BottomSheet>
  );
}
