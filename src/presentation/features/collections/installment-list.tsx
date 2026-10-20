import { Text, View } from 'react-native';
import { ReceivableEntity } from '@/core/entities/receivable.entity';
import type { Installment } from '@/core/types/collection.types';
import { Badge, type BadgeProps } from '@/presentation/components/ui/badge';
import { es } from '@/shared/i18n/es';
import { formatDate } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';

type InstallmentState = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

const BADGES: Readonly<Record<InstallmentState, NonNullable<BadgeProps['variant']>>> = {
  PENDING: 'default',
  PARTIAL: 'info',
  PAID: 'success',
  OVERDUE: 'destructive',
};

function stateOf(installment: Installment, now: Date): InstallmentState {
  if (installment.status === 'PAID') return 'PAID';
  return new Date(installment.dueDate).getTime() < now.getTime() ? 'OVERDUE' : installment.status;
}

export interface InstallmentListProps {
  installments: readonly Installment[];
  now?: Date;
}

/** "Cuota 2 de 4 · vence 21 oct · $25,00 · Vencida" rows. */
export function InstallmentList({ installments, now = new Date() }: InstallmentListProps) {
  return (
    <View className="gap-2">
      {installments.map((installment) => {
        const state = stateOf(installment, now);
        const remaining = ReceivableEntity.remainingOf(installment);
        return (
          <View key={installment.id} className="flex-row items-center justify-between">
            <View className="mr-2 flex-1">
              <Text className="text-sm text-foreground">
                {es.collections.installment} {installment.number} {es.collections.of}{' '}
                {installments.length}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {es.collections.dueOn} {formatDate(installment.dueDate)}
              </Text>
            </View>
            <View className="items-end gap-1">
              <Text className="text-sm font-semibold text-foreground">
                {formatCurrency(state === 'PAID' ? installment.amount : remaining)}
              </Text>
              <Badge
                size="sm"
                variant={BADGES[state]}
                label={es.collections.installmentStatus[state]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
