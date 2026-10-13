import { useMemo } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { useAuthSession } from '@/application/hooks/auth/use-auth-session';
import { useSyncNow } from '@/application/hooks/sync/use-sync-now';
import { useVisits } from '@/application/hooks/visits/use-visits';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { OfflineBanner } from '@/presentation/components/feedback/offline-banner';
import { SyncStatusPill } from '@/presentation/components/feedback/sync-status-pill';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { VisitCard } from '@/presentation/features/visits/visit-card';
import { es } from '@/shared/i18n/es';
import { dayRange, formatDayLabel, todayKey, toLocalTime } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';

function greeting(): string {
  const hour = Number(toLocalTime(new Date()).slice(0, 2));
  if (hour < 12) return es.agenda.greetingMorning;
  if (hour < 19) return es.agenda.greetingAfternoon;
  return es.agenda.greetingEvening;
}

/**
 * Today's visits in the business time zone. The full agenda (calendar, summary, visit
 * flow) is built on top of this in the next phase.
 */
export default function AgendaScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useAuthSession();
  const day = todayKey();
  const filter = useMemo(() => dayRange(day), [day]);
  const { visits, isLoading } = useVisits(filter);
  const { syncNow, isSyncing } = useSyncNow();

  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        subtitle={formatDayLabel(day)}
        rightElement={<SyncStatusPill onPress={() => router.push('/(app)/(tabs)/more')} />}
      />
      <OfflineBanner />

      {isLoading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(visit) => visit.id}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          renderItem={({ item }) => (
            <VisitCard
              visit={item}
              onPress={(visit) =>
                router.push({ pathname: '/(app)/visit/[id]', params: { id: visit.id } })
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
            <EmptyState
              icon={<CalendarDays size={32} color={colors.mutedForeground} />}
              title={es.agenda.emptyTitle}
              description={es.agenda.emptyDescription}
            />
          }
        />
      )}
    </View>
  );
}
