import { Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import type { PaymentBalances } from '@/core/entities/payment.entity';
import type { InstallmentAllocation } from '@/core/value-objects/payment-schedule';
import { es } from '@/shared/i18n/es';
import { formatCurrency } from '@/shared/utils/format-currency';
import { useThemeColors } from '@/theme';

const t = es.collections.balances;

function Row({
  label,
  value,
  strong = false,
  tone = 'default',
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'default' | 'success';
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text
        className={`text-sm ${strong ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
      >
        {label}
      </Text>
      <Text
        className={`${strong ? 'text-base font-bold' : 'text-sm font-medium'} ${
          tone === 'success' ? 'text-success' : 'text-foreground'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

/** Before → paid → after for each installment the payment touched. */
function InstallmentFlow({ allocation }: { allocation: InstallmentAllocation }) {
  const colors = useThemeColors();
  const before = allocation.balanceBefore;
  const after =
    before === null || before === undefined ? null : Math.max(0, before - allocation.amount);
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm font-medium text-foreground">
        {t.installment(allocation.installmentNumber)}
      </Text>
      <View className="flex-row items-center gap-1.5">
        {before !== null && before !== undefined ? (
          <>
            <Text className="text-xs text-muted-foreground">{formatCurrency(before)}</Text>
            <ArrowRight size={12} color={colors.mutedForeground} />
          </>
        ) : null}
        <Text className="text-xs font-semibold text-success">
          −{formatCurrency(allocation.amount)}
        </Text>
        {after !== null ? (
          <>
            <ArrowRight size={12} color={colors.mutedForeground} />
            <Text className="text-sm font-bold text-foreground">
              {after === 0 ? t.settled : formatCurrency(after)}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

export interface PaymentBalancesViewProps {
  amount: number;
  balances: PaymentBalances | null;
  allocations: readonly InstallmentAllocation[];
}

/**
 * What the invoice and the customer owed before the payment, the payment and what is left
 * (API ADR 0044), with the split by installment. Used before collecting (preview) and in the
 * payment's receipt.
 */
export function PaymentBalancesView({ amount, balances, allocations }: PaymentBalancesViewProps) {
  return (
    <View>
      {balances ? (
        <>
          <Row label={t.invoiceBefore} value={formatCurrency(balances.receivableBefore)} />
          <Row label={t.paid} value={`−${formatCurrency(amount)}`} tone="success" />
          <Row label={t.invoiceAfter} value={formatCurrency(balances.receivableAfter)} strong />
          {balances.customerBefore !== null && balances.customerAfter !== null ? (
            <View className="mt-1 border-t border-border pt-1">
              <Row label={t.customerBefore} value={formatCurrency(balances.customerBefore)} />
              <Row label={t.customerAfter} value={formatCurrency(balances.customerAfter)} />
            </View>
          ) : null}
        </>
      ) : (
        <Text className="text-xs text-muted-foreground">{t.noBalances}</Text>
      )}
      {allocations.length > 0 ? (
        <View className="mt-2 border-t border-border pt-2">
          <Text className="mb-1 text-xs font-medium uppercase text-muted-foreground">
            {t.byInstallment}
          </Text>
          {allocations.map((allocation) => (
            <InstallmentFlow key={allocation.installmentNumber} allocation={allocation} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
