import { Text, View } from 'react-native';
import { CloudUpload, HandCoins } from 'lucide-react-native';
import type { ReceivableEntity } from '@/core/entities/receivable.entity';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { es } from '@/shared/i18n/es';
import { formatDate } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';
import { useThemeColors } from '@/theme';
import { InstallmentList } from './installment-list';

export interface ReceivableCardProps {
  receivable: ReceivableEntity;
  overdue: number;
  onCollect?: (receivable: ReceivableEntity) => void;
}

/** One document the customer owes: number, plan, balance, overdue and its installments. */
export function ReceivableCard({ receivable, overdue, onCollect }: ReceivableCardProps) {
  const colors = useThemeColors();

  return (
    <Card testID={`receivable-${receivable.id}`} className="gap-3 p-4">
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
            {es.collections.sources[receivable.source]}{' '}
            {receivable.documentNumber || es.collections.pendingNumber}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(receivable.issuedAt)} · {es.collections.plans[receivable.planType]} ·{' '}
            {formatCurrency(receivable.total)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-foreground">
            {formatCurrency(receivable.balance)}
          </Text>
          {overdue > 0 ? (
            <Badge
              size="sm"
              variant="destructive"
              label={`${es.collections.overdue} ${formatCurrency(overdue)}`}
            />
          ) : null}
        </View>
      </View>

      {receivable.syncStatus !== 'SYNCED' ? (
        <View className="flex-row items-center">
          <CloudUpload size={14} color={colors.warning} />
          <Text className="ml-1.5 text-xs text-warning">{es.orders.pendingNumber}</Text>
        </View>
      ) : null}

      <InstallmentList installments={receivable.installments} />

      {onCollect && receivable.isOpen() ? (
        <Button
          testID={`receivable-collect-${receivable.id}`}
          variant="secondary"
          size="sm"
          leftIcon={<HandCoins size={14} color={colors.secondaryForeground} />}
          onPress={() => onCollect(receivable)}
        >
          {es.collections.register}
        </Button>
      ) : null}
    </Card>
  );
}
