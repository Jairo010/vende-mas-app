import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageCircle, PackageX } from 'lucide-react-native';
import { useCustomer } from '@/application/hooks/customers/use-customer';
import { useOrder } from '@/application/hooks/orders/use-order';
import { DetailRow } from '@/presentation/components/common/detail-row';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { AlertBanner } from '@/presentation/components/feedback/alert-banner';
import { notify } from '@/presentation/components/feedback/toast';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { StickyFooter } from '@/presentation/components/ui/sticky-footer';
import { OrderLineRow } from '@/presentation/features/orders/order-line-row';
import { shareOrderOnWhatsApp } from '@/presentation/features/orders/order-receipt';
import { OrderTotals } from '@/presentation/features/orders/order-totals';
import { ORDER_STATUS_BADGES, orderSyncBadge } from '@/presentation/features/orders/order-visuals';
import { es } from '@/shared/i18n/es';
import { formatDate, formatDateTime } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';
import { useThemeColors } from '@/theme';

/**
 * An order as stored on the device. Once synced it shows the official number and the
 * server's prices (with the adjusted ones listed), and it can be shared on WhatsApp.
 */
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { order, isLoading } = useOrder(id);
  const { customer } = useCustomer(order?.customerId);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/orders');

  if (isLoading || !order) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={es.orders.detailTitle} onBack={goBack} />
        {isLoading ? (
          <View className="gap-3 p-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-56" />
          </View>
        ) : (
          <EmptyState
            icon={<PackageX size={32} color={colors.mutedForeground} />}
            title={es.orders.notFound}
          />
        )}
      </View>
    );
  }

  const syncBadge = orderSyncBadge(order);
  const productNames = new Map(order.items.map((item) => [item.productId, item.productName]));

  const share = () => {
    shareOrderOnWhatsApp(order, customer?.phone).catch((error: unknown) => notify.error(error));
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={order.orderNumber ?? es.orders.detailTitle}
        subtitle={order.customerName ?? undefined}
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        <Card className="p-4">
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge
              variant={ORDER_STATUS_BADGES[order.status]}
              label={es.orders.statuses[order.status]}
            />
            {syncBadge ? <Badge variant={syncBadge.variant} label={syncBadge.label} /> : null}
          </View>
          <View className="mt-3">
            <DetailRow
              label={es.orders.fields.number}
              value={order.orderNumber ?? es.orders.receipt.pendingNumber}
            />
            <DetailRow label={es.orders.fields.customer} value={order.customerName} />
            <DetailRow label={es.orders.fields.createdAt} value={formatDateTime(order.createdAt)} />
            <DetailRow
              label={es.orders.fields.delivery}
              value={order.estimatedDeliveryDate ? formatDate(order.estimatedDeliveryDate) : null}
            />
            {order.invoiceNumber ? (
              <DetailRow label={es.orders.fields.invoice} value={order.invoiceNumber} />
            ) : null}
            <DetailRow label={es.orders.fields.notes} value={order.notes} isLast />
          </View>
        </Card>

        {order.priceAdjustments.length > 0 ? (
          <Card className="gap-2 border-warning/40 p-4">
            <Text className="text-base font-semibold text-foreground">
              {es.orders.priceAdjustedTitle}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {es.orders.priceAdjustedDescription}
            </Text>
            {order.priceAdjustments.map((adjustment) => (
              <Text key={adjustment.productId} className="text-sm text-foreground">
                • {productNames.get(adjustment.productId) ?? adjustment.productId}:{' '}
                {formatCurrency(adjustment.expectedUnitPrice)} →{' '}
                <Text className="font-semibold">{formatCurrency(adjustment.unitPrice)}</Text>
              </Text>
            ))}
          </Card>
        ) : null}

        <Card className="overflow-hidden p-0">
          {order.items.map((item, index) => (
            <View key={item.id} className={index > 0 ? 'border-t border-border' : ''}>
              <OrderLineRow
                name={item.productName}
                code={item.productCode}
                quantity={item.quantity}
                unitPrice={item.unitPrice}
                discount={item.discount}
                totalPrice={item.totalPrice}
                promotionName={item.promotionName}
              />
            </View>
          ))}
        </Card>

        <Card className="p-4">
          <OrderTotals totals={order} />
        </Card>

        {order.isPendingSync() && order.syncStatus !== 'REJECTED' ? (
          <AlertBanner variant="info" message={es.orders.review.estimate} />
        ) : null}
      </ScrollView>

      <StickyFooter>
        <Button
          testID="order-share-whatsapp"
          variant="secondary"
          leftIcon={<MessageCircle size={18} color={colors.secondaryForeground} />}
          onPress={share}
        >
          {es.orders.shareWhatsApp}
        </Button>
      </StickyFooter>
    </View>
  );
}
