import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { HandCoins } from 'lucide-react-native';
import { usePayments } from '@/application/hooks/collections/use-payments';
import { useSyncNow } from '@/application/hooks/sync/use-sync-now';
import { PAYMENT_METHODS, type PaymentMethod } from '@/core/types/collection.types';
import { fromCents, toCents } from '@/core/value-objects/payment-schedule';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { OfflineBanner } from '@/presentation/components/feedback/offline-banner';
import { Card } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { SegmentedControl } from '@/presentation/components/ui/segmented-control';
import { PaymentListItem } from '@/presentation/features/collections/payment-list-item';
import { PAYMENT_METHOD_VISUALS } from '@/presentation/features/collections/payment-method-visuals';
import { es } from '@/shared/i18n/es';
import { dayRange, startOfWeek, todayKey } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';
import { useThemeColors } from '@/theme';

type Period = 'TODAY' | 'WEEK' | 'MONTH';

const PERIODS = (['TODAY', 'WEEK', 'MONTH'] as const).map((value) => ({
  value,
  label: es.collections.periods[value],
}));

function rangeOf(period: Period): { from: string; to: string } {
  const today = todayKey();
  const first =
    period === 'TODAY' ? today : period === 'WEEK' ? startOfWeek(today) : `${today.slice(0, 7)}-01`;
  return { from: dayRange(first).from, to: dayRange(today).to };
}

/**
 * The seller's collections: what was collected in the period, by method (cash to hand over,
 * transfers to verify, checks to deposit), payment by payment.
 */
export default function CollectionsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [period, setPeriod] = useState<Period>('TODAY');
  const filter = useMemo(() => rangeOf(period), [period]);
  const { payments, isLoading } = usePayments(filter);
  const { syncNow, isSyncing } = useSyncNow();

  const totals = useMemo(() => {
    const byMethod = Object.fromEntries(PAYMENT_METHODS.map((method) => [method, 0])) as Record<
      PaymentMethod,
      number
    >;
    let total = 0;
    for (const payment of payments) {
      byMethod[payment.method] += toCents(payment.amount);
      total += toCents(payment.amount);
    }
    return { total: fromCents(total), byMethod };
  }, [payments]);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={es.collections.myCollections} onBack={() => router.back()} />
      <OfflineBanner />

      <FlatList
        data={payments}
        keyExtractor={(payment) => payment.id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        ListHeaderComponent={
          <View className="gap-4 p-4">
            <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />
            <Card className="gap-3 p-4">
              <View>
                <Text className="text-xs text-muted-foreground">{es.collections.total}</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {formatCurrency(totals.total)}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {payments.length} {es.collections.count}
                </Text>
              </View>
              <View className="gap-1.5">
                <Text className="text-xs font-semibold uppercase text-muted-foreground">
                  {es.collections.byMethod}
                </Text>
                {PAYMENT_METHODS.filter((method) => totals.byMethod[method] > 0).map((method) => {
                  const visual = PAYMENT_METHOD_VISUALS[method];
                  const Icon = visual.icon;
                  return (
                    <View key={method} className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Icon size={14} color={colors.mutedForeground} />
                        <Text className="ml-2 text-sm text-foreground">{visual.label}</Text>
                      </View>
                      <Text className="text-sm font-semibold text-foreground">
                        {formatCurrency(fromCents(totals.byMethod[method]))}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        renderItem={({ item }) => (
          <PaymentListItem
            payment={item}
            onPress={(payment) =>
              router.push({ pathname: '/(app)/payment/[id]', params: { id: payment.id } })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={() => void syncNow()}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={<HandCoins size={32} color={colors.mutedForeground} />}
              title={es.collections.noPayments}
            />
          )
        }
      />
    </View>
  );
}
