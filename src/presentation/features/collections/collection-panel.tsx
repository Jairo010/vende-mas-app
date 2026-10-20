import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useCollectionsSettings } from '@/application/hooks/collections/use-collections-settings';
import { useCustomerBalance } from '@/application/hooks/collections/use-customer-balance';
import { usePayments } from '@/application/hooks/collections/use-payments';
import { useReceivables } from '@/application/hooks/collections/use-receivables';
import type { PaymentEntity } from '@/core/entities/payment.entity';
import type { ReceivableEntity } from '@/core/entities/receivable.entity';
import { Card } from '@/presentation/components/ui/card';
import { es } from '@/shared/i18n/es';
import { CustomerBalanceCard } from './customer-balance-card';
import { PaymentListItem } from './payment-list-item';
import { ReceivableCard } from './receivable-card';

export interface CollectionPanelProps {
  customerId: string;
  /** Payments registered in this visit are listed apart. */
  visitId?: string;
  /** Collect a document (or, without one, let the seller choose). */
  onCollect: (receivable?: ReceivableEntity) => void;
  onOpenPayment?: (payment: PaymentEntity) => void;
}

/** What the customer owes, document by document, and what was collected in this visit. */
export function CollectionPanel({
  customerId,
  visitId,
  onCollect,
  onOpenPayment,
}: CollectionPanelProps) {
  const { settings } = useCollectionsSettings();
  const { balance } = useCustomerBalance(customerId);
  const receivableFilter = useMemo(() => ({ customerId, onlyOpen: true }), [customerId]);
  const { receivables } = useReceivables(receivableFilter);
  const paymentFilter = useMemo(() => ({ visitId }), [visitId]);
  const { payments } = usePayments(paymentFilter, Boolean(visitId));
  const now = new Date();

  return (
    <View className="gap-4">
      <CustomerBalanceCard balance={balance} onCollect={() => onCollect()} />

      {visitId ? (
        <Card className="overflow-hidden p-0">
          <View className="p-4">
            <Text className="text-base font-semibold text-foreground">
              {es.collections.paymentsOfVisit}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              {payments.length > 0 ? es.collections.visitHint : es.collections.noPaymentsOfVisit}
            </Text>
          </View>
          {payments.map((payment) => (
            <View key={payment.id} className="border-t border-border">
              <PaymentListItem payment={payment} onPress={onOpenPayment} />
            </View>
          ))}
        </Card>
      ) : null}

      {receivables.length > 0 ? (
        <View className="gap-3">
          <Text className="text-base font-semibold text-foreground">
            {es.collections.receivables}
          </Text>
          {receivables.map((receivable) => (
            <ReceivableCard
              key={receivable.id}
              receivable={receivable}
              overdue={receivable.overdueAmount(now, settings.overdueGraceDays)}
              onCollect={onCollect}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
