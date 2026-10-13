import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText, UserX } from 'lucide-react-native';
import { useCustomer } from '@/application/hooks/customers/use-customer';
import { DetailRow } from '@/presentation/components/common/detail-row';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { Avatar } from '@/presentation/components/ui/avatar';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

/** Customer card; history and map link come with the customers phase. */
export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { customer, isLoading } = useCustomer(id);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={es.customers.detailTitle} onBack={() => router.back()} />
      {isLoading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-56" />
        </View>
      ) : !customer ? (
        <EmptyState
          icon={<UserX size={32} color={colors.mutedForeground} />}
          title={es.customers.notFound}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Card className="flex-row items-center p-4">
            <Avatar
              name={customer.tradeName}
              imageUri={customer.storePhotoUrl ?? customer.storePhotoLocalUri}
              size="lg"
            />
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-foreground">{customer.tradeName}</Text>
              <Badge
                className="mt-2"
                size="sm"
                variant={customer.isProspect() ? 'warning' : 'success'}
                label={es.customers.statuses[customer.status]}
              />
            </View>
          </Card>

          <Card className="px-4 py-2">
            <DetailRow label={es.customers.fields.businessName} value={customer.businessName} />
            <DetailRow label={es.customers.fields.identification} value={customer.identification} />
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

          {customer.isProspect() ? (
            <Button
              testID="customer-complete-billing"
              variant="outline"
              leftIcon={<FileText size={16} color={colors.foreground} />}
              onPress={() =>
                router.push({
                  pathname: '/(app)/customer/[id]/billing',
                  params: { id: customer.id },
                })
              }
            >
              {es.visits.actions.completeBilling}
            </Button>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
