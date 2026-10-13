import { Text, View } from 'react-native';
import type { OrderTotals as Totals } from '@/core/value-objects/money';
import { es } from '@/shared/i18n/es';
import { formatCurrency } from '@/shared/utils/format-currency';

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text
        className={strong ? 'text-base font-bold text-foreground' : 'text-sm text-muted-foreground'}
      >
        {label}
      </Text>
      <Text className={strong ? 'text-lg font-bold text-foreground' : 'text-sm text-foreground'}>
        {value}
      </Text>
    </View>
  );
}

/** Subtotal, discount, VAT and total (USD). */
export function OrderTotals({ totals }: { totals: Totals }) {
  return (
    <View>
      <Row label={es.orders.subtotal} value={formatCurrency(totals.subtotal)} />
      {totals.discountTotal > 0 ? (
        <Row label={es.orders.discount} value={`-${formatCurrency(totals.discountTotal)}`} />
      ) : null}
      <Row label={es.orders.tax} value={formatCurrency(totals.taxTotal)} />
      <View className="my-1 h-px bg-border" />
      <Row label={es.orders.total} value={formatCurrency(totals.total)} strong />
    </View>
  );
}
