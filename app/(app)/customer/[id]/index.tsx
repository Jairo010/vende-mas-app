import { useMemo, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  CalendarPlus,
  CloudUpload,
  FileText,
  Navigation,
  Phone,
  ShoppingCart,
  UserX,
} from 'lucide-react-native';
import { useCustomer } from '@/application/hooks/customers/use-customer';
import { usePhotoSource } from '@/application/hooks/files/use-photo-source';
import { useOrders } from '@/application/hooks/orders/use-orders';
import { useCustomerVisits } from '@/application/hooks/visits/use-customer-visits';
import { DetailRow } from '@/presentation/components/common/detail-row';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { Avatar } from '@/presentation/components/ui/avatar';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { CustomerHistory } from '@/presentation/features/customers/customer-history';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

const PHOTO_HEIGHT = 200;

function QuickAction({
  label,
  icon,
  onPress,
  testID,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className="min-w-[45%] flex-1 flex-row items-center justify-center rounded-xl border border-border bg-card py-3 active:bg-muted"
    >
      {icon}
      <Text className="ml-2 text-sm font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}

/** Customer card: store photo, shortcuts (visit, order, call, map), billing data and history. */
export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { customer, isLoading } = useCustomer(id);
  const { visits } = useCustomerVisits(id);
  const ordersFilter = useMemo(() => ({ customerId: id }), [id]);
  const { orders } = useOrders(ordersFilter);
  const photo = usePhotoSource(customer?.storePhotoUrl ?? customer?.storePhotoLocalUri);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/customers');

  if (isLoading || !customer) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={es.customers.detailTitle} onBack={goBack} />
        {isLoading ? (
          <View className="gap-3 p-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-56" />
          </View>
        ) : (
          <EmptyState
            icon={<UserX size={32} color={colors.mutedForeground} />}
            title={es.customers.notFound}
          />
        )}
      </View>
    );
  }

  const openMap = () => {
    const query = `${customer.latitude},${customer.longitude}`;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={es.customers.detailTitle} onBack={goBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        <Card className="overflow-hidden p-0">
          {photo ? (
            <Image
              source={photo}
              style={{ width: '100%', height: PHOTO_HEIGHT }}
              contentFit="cover"
              accessibilityLabel={customer.tradeName}
            />
          ) : null}
          <View className="flex-row items-center p-4">
            {!photo ? <Avatar name={customer.tradeName} size="lg" /> : null}
            <View className={`flex-1 ${photo ? '' : 'ml-4'}`}>
              <Text className="text-lg font-bold text-foreground">{customer.tradeName}</Text>
              {customer.businessName && customer.businessName !== customer.tradeName ? (
                <Text className="text-sm text-muted-foreground">{customer.businessName}</Text>
              ) : null}
              <View className="mt-2 flex-row items-center gap-2">
                <Badge
                  size="sm"
                  variant={customer.isProspect() ? 'warning' : 'success'}
                  label={es.customers.statuses[customer.status]}
                />
                {customer.syncStatus !== 'SYNCED' ? (
                  <CloudUpload
                    size={14}
                    color={customer.syncStatus === 'REJECTED' ? colors.destructive : colors.warning}
                  />
                ) : null}
              </View>
              {!photo ? (
                <Text className="mt-1 text-xs text-muted-foreground">
                  {es.customers.noStorePhoto}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        <View className="flex-row flex-wrap gap-2">
          <QuickAction
            testID="customer-new-visit"
            label={es.customers.actions.newVisit}
            icon={<CalendarPlus size={16} color={colors.primary} />}
            onPress={() =>
              router.push({ pathname: '/(app)/visit/new', params: { customerId: customer.id } })
            }
          />
          {customer.canTakeOrders() ? (
            <QuickAction
              testID="customer-new-order"
              label={es.customers.actions.newOrder}
              icon={<ShoppingCart size={16} color={colors.primary} />}
              onPress={() =>
                router.push({ pathname: '/(app)/order/new', params: { customerId: customer.id } })
              }
            />
          ) : null}
          {customer.phone ? (
            <QuickAction
              testID="customer-call"
              label={es.visits.actions.call}
              icon={<Phone size={16} color={colors.primary} />}
              onPress={() => Linking.openURL(`tel:${customer.phone}`).catch(() => {})}
            />
          ) : null}
          {customer.hasLocation() ? (
            <QuickAction
              testID="customer-open-map"
              label={es.visits.actions.openMap}
              icon={<Navigation size={16} color={colors.primary} />}
              onPress={openMap}
            />
          ) : null}
        </View>

        {customer.isProspect() ? (
          <Button
            testID="customer-complete-billing"
            leftIcon={<FileText size={16} color={colors.primaryForeground} />}
            onPress={() =>
              router.push({ pathname: '/(app)/customer/[id]/billing', params: { id: customer.id } })
            }
          >
            {es.visits.actions.completeBilling}
          </Button>
        ) : null}

        <Card className="px-4 py-2">
          <DetailRow label={es.customers.fields.businessName} value={customer.businessName} />
          <DetailRow
            label={es.customers.fields.identification}
            value={
              customer.identification
                ? `${customer.identificationType ? `${es.customers.identificationTypes[customer.identificationType]} ` : ''}${customer.identification}`
                : null
            }
          />
          <DetailRow label={es.customers.fields.contact} value={customer.contactName} />
          <DetailRow label={es.customers.fields.phone} value={customer.phone} />
          <DetailRow label={es.customers.fields.email} value={customer.email} />
          <DetailRow label={es.customers.fields.address} value={customer.address} />
          <DetailRow
            label={es.customers.fields.reference}
            value={customer.addressReference}
            isLast
          />
        </Card>

        <CustomerHistory
          visits={visits}
          orders={orders}
          onOpenVisit={(visit) =>
            router.push({ pathname: '/(app)/visit/[id]', params: { id: visit.id } })
          }
          onOpenOrder={(order) =>
            router.push({ pathname: '/(app)/order/[id]', params: { id: order.id } })
          }
        />
      </ScrollView>
    </View>
  );
}
