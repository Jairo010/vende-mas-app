import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MessageCircle, ReceiptText } from 'lucide-react-native';
import { usePayment } from '@/application/hooks/collections/use-payment';
import { useReceivable } from '@/application/hooks/collections/use-receivable';
import { useCustomer } from '@/application/hooks/customers/use-customer';
import { usePhotoSource } from '@/application/hooks/files/use-photo-source';
import { DetailRow } from '@/presentation/components/common/detail-row';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { notify } from '@/presentation/components/feedback/toast';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { StickyFooter } from '@/presentation/components/ui/sticky-footer';
import { PAYMENT_METHOD_VISUALS } from '@/presentation/features/collections/payment-method-visuals';
import { sharePaymentOnWhatsApp } from '@/presentation/features/collections/payment-receipt';
import { es } from '@/shared/i18n/es';
import { formatDate, formatDateTime } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';
import { useThemeColors } from '@/theme';

const PHOTO_HEIGHT = 200;

/** Receipt of a payment: what, how, which installments, and the WhatsApp receipt. */
export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { payment, isLoading } = usePayment(id);
  const { receivable } = useReceivable(payment?.receivableId);
  const { customer } = useCustomer(payment?.customerId);
  const photo = usePhotoSource(payment?.photoUrl ?? payment?.photoLocalUri);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(app)/collections'));

  if (isLoading || !payment) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={es.collections.receipt.title} onBack={goBack} />
        {isLoading ? (
          <View className="gap-3 p-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </View>
        ) : (
          <EmptyState
            icon={<ReceiptText size={32} color={colors.mutedForeground} />}
            title={es.collections.noPayments}
          />
        )}
      </View>
    );
  }

  const method = PAYMENT_METHOD_VISUALS[payment.method];
  const Icon = method.icon;
  const balance = receivable?.balance ?? null;

  const share = () => {
    sharePaymentOnWhatsApp(payment, balance, customer?.phone).catch((error: unknown) =>
      notify.error(error),
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={es.collections.receipt.title}
        subtitle={payment.customerName ?? undefined}
        onBack={goBack}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        <Card className="items-center gap-2 p-5">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <Icon size={22} color={colors.foreground} />
          </View>
          <Text className="text-3xl font-bold text-foreground">
            {formatCurrency(payment.amount)}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {method.label} · {formatDateTime(payment.paidAt)}
          </Text>
          {payment.syncStatus !== 'SYNCED' ? (
            <Badge
              variant={payment.syncStatus === 'REJECTED' ? 'destructive' : 'warning'}
              label={
                payment.syncStatus === 'REJECTED' ? es.orders.rejected : es.orders.pendingNumber
              }
            />
          ) : null}
        </Card>

        <Card className="px-4 py-2">
          <DetailRow label={es.collections.receipt.customer} value={payment.customerName} />
          <DetailRow
            label={es.collections.receipt.document}
            value={payment.documentNumber || es.collections.pendingNumber}
          />
          {payment.reference ? (
            <DetailRow label={es.collections.receipt.reference} value={payment.reference} />
          ) : null}
          {payment.bankName ? (
            <DetailRow label={es.collections.form.bank} value={payment.bankName} />
          ) : null}
          {payment.checkDate ? (
            <DetailRow
              label={es.collections.form.checkDate}
              value={formatDate(payment.checkDate)}
            />
          ) : null}
          <DetailRow
            label={es.collections.receipt.installments}
            value={payment.allocations
              .map(
                (allocation) =>
                  `#${allocation.installmentNumber} ${formatCurrency(allocation.amount)}`,
              )
              .join(', ')}
          />
          <DetailRow
            label={es.collections.receipt.balance}
            value={balance !== null ? formatCurrency(balance) : null}
          />
          <DetailRow label={es.collections.form.notes} value={payment.notes} isLast />
        </Card>

        {photo ? (
          <Image
            source={photo}
            style={{ width: '100%', height: PHOTO_HEIGHT, borderRadius: 16 }}
            contentFit="cover"
            accessibilityLabel={es.collections.form.photo}
          />
        ) : null}
      </ScrollView>

      <StickyFooter>
        <Button
          testID="payment-share-whatsapp"
          variant="secondary"
          leftIcon={<MessageCircle size={18} color={colors.secondaryForeground} />}
          onPress={share}
        >
          {es.collections.shareReceipt}
        </Button>
      </StickyFooter>
    </View>
  );
}
