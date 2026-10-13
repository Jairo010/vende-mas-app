import { Text, View } from 'react-native';
import type { PaymentEntity } from '@/core/entities/payment.entity';
import { Badge } from '@/presentation/components/ui/badge';
import { ListItem } from '@/presentation/components/ui/list-item';
import { es } from '@/shared/i18n/es';
import { formatDateTime } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';
import { useThemeColors } from '@/theme';
import { PAYMENT_METHOD_VISUALS } from './payment-method-visuals';

export interface PaymentListItemProps {
  payment: PaymentEntity;
  onPress?: (payment: PaymentEntity) => void;
}

/** A collected payment: method, customer, document, time and sync state. */
export function PaymentListItem({ payment, onPress }: PaymentListItemProps) {
  const colors = useThemeColors();
  const method = PAYMENT_METHOD_VISUALS[payment.method];
  const Icon = method.icon;

  return (
    <ListItem
      testID={`payment-item-${payment.id}`}
      title={payment.customerName ?? '—'}
      subtitle={`${method.label}${payment.reference ? ` · ${payment.reference}` : ''}`}
      caption={formatDateTime(payment.paidAt)}
      leading={
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted">
          <Icon size={18} color={colors.foreground} />
        </View>
      }
      trailing={
        <View className="items-end gap-1">
          <Text className="text-base font-bold text-foreground">
            {formatCurrency(payment.amount)}
          </Text>
          {payment.syncStatus !== 'SYNCED' ? (
            <Badge
              size="sm"
              variant={payment.syncStatus === 'REJECTED' ? 'destructive' : 'warning'}
              label={
                payment.syncStatus === 'REJECTED' ? es.orders.rejected : es.sync.indicator.pending
              }
            />
          ) : null}
        </View>
      }
      onPress={onPress ? () => onPress(payment) : undefined}
    />
  );
}
