import { Text, View } from 'react-native';
import type { ProductEntity } from '@/core/entities/product.entity';
import type { PricedOrder } from '@/core/value-objects/order-pricing';
import { AlertBanner } from '@/presentation/components/feedback/alert-banner';
import { Card } from '@/presentation/components/ui/card';
import { DatePickerField } from '@/presentation/components/ui/date-time-picker-field';
import { Input } from '@/presentation/components/ui/input';
import { es } from '@/shared/i18n/es';
import { addDays, todayKey, type DateKey } from '@/shared/utils/date';
import { OrderLineRow } from './order-line-row';
import { OrderTotals } from './order-totals';

const MAX_NOTES_LENGTH = 1000;

export interface OrderReviewProps {
  priced: PricedOrder;
  /** Products of the priced lines, in the same order. */
  products: readonly ProductEntity[];
  /** Cart entries whose product is no longer sold (must be removed to confirm). */
  unavailable: readonly { productId: string; name: string; quantity: number }[];
  onChangeQuantity: (productId: string, quantity: number) => void;
  deliveryDate: DateKey | null;
  onChangeDeliveryDate: (date: DateKey) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
}

/** Cart review: editable lines, delivery date, notes and estimated totals. */
export function OrderReview({
  priced,
  products,
  unavailable,
  onChangeQuantity,
  deliveryDate,
  onChangeDeliveryDate,
  notes,
  onChangeNotes,
}: OrderReviewProps) {
  return (
    <View className="gap-4">
      <Card className="overflow-hidden p-0">
        {priced.lines.map((line, index) => {
          const product = products[index];
          return (
            <View key={line.productId} className={index > 0 ? 'border-t border-border' : ''}>
              <OrderLineRow
                testID={`order-line-${line.productId}`}
                name={product.name}
                code={product.code}
                quantity={line.quantity}
                unitPrice={line.unitPrice}
                discount={line.discount}
                totalPrice={line.totalPrice}
                promotionName={line.promotion?.name ?? null}
                warning={line.quantity > product.stockQuantity ? es.orders.cart.overStock : null}
                onChangeQuantity={(quantity) => onChangeQuantity(line.productId, quantity)}
              />
            </View>
          );
        })}
        {unavailable.map((entry) => (
          <View key={entry.productId} className="border-t border-border">
            <OrderLineRow
              name={entry.name}
              code="—"
              quantity={entry.quantity}
              unitPrice={0}
              discount={0}
              totalPrice={0}
              promotionName={null}
              warning={es.orders.cart.unavailable}
              onChangeQuantity={(quantity) => onChangeQuantity(entry.productId, quantity)}
            />
          </View>
        ))}
      </Card>

      <Card className="gap-4 p-4">
        <View>
          <DatePickerField
            testID="order-delivery-date"
            label={es.orders.review.deliveryDate}
            value={deliveryDate}
            minDate={addDays(todayKey(), 1)}
            onChange={onChangeDeliveryDate}
          />
          <Text className="mt-1.5 text-xs text-muted-foreground">
            {es.orders.review.deliveryHint}
          </Text>
        </View>
        <Input
          testID="order-notes"
          label={`${es.orders.review.notes} (${es.common.optional.toLowerCase()})`}
          placeholder={es.orders.review.notesPlaceholder}
          value={notes}
          onChangeText={onChangeNotes}
          maxLength={MAX_NOTES_LENGTH}
          multiline
          textAlignVertical="top"
          inputClassName="min-h-[72px]"
        />
      </Card>

      <Card className="p-4">
        <OrderTotals totals={priced.totals} />
      </Card>

      <AlertBanner variant="info" message={es.orders.review.estimate} />
    </View>
  );
}
