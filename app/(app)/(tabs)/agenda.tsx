import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays, Plus, Route } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthSession } from '@/application/hooks/auth/use-auth-session';
import { isPendingForRoute } from '@/application/route/route-plan';
import { useSyncNow } from '@/application/hooks/sync/use-sync-now';
import { useCheckInVisit } from '@/application/hooks/visits/use-check-in-visit';
import { useVisitInProgress } from '@/application/hooks/visits/use-visit-in-progress';
import { useVisits } from '@/application/hooks/visits/use-visits';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { VisitAlreadyInProgressError } from '@/core/errors/visit.errors';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { Button } from '@/presentation/components/ui/button';
import { OfflineBanner } from '@/presentation/components/feedback/offline-banner';
import { SyncStatusPill } from '@/presentation/components/feedback/sync-status-pill';
import { notify } from '@/presentation/components/feedback/toast';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { AgendaCalendar } from '@/presentation/features/agenda/agenda-calendar';
import {
  buildCalendarMarks,
  summarizeDay,
  visibleMonthRange,
} from '@/presentation/features/agenda/agenda-marks';
import { AgendaSummary } from '@/presentation/features/agenda/agenda-summary';
import { VisitCard } from '@/presentation/features/visits/visit-card';
import { VisitInProgressBanner } from '@/presentation/features/visits/visit-in-progress-banner';
import { useNow } from '@/shared/hooks/use-now';
import { es } from '@/shared/i18n/es';
import {
  dayRange,
  formatDayLabel,
  toDateKey,
  todayKey,
  toLocalTime,
  type DateKey,
} from '@/shared/utils/date';
import { useThemeColors } from '@/theme';

function greeting(now: Date): string {
  const hour = Number(toLocalTime(now).slice(0, 2));
  if (hour < 12) return es.agenda.greetingMorning;
  if (hour < 19) return es.agenda.greetingAfternoon;
  return es.agenda.greetingEvening;
}

/**
 * Home: calendar with dots per visit type, the day's summary and timeline, the visit in
 * progress and quick check-in. Everything reads the device database (works offline).
 */
export default function AgendaScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const now = useNow(60_000);
  const today = todayKey(now);
  const { user, canSeeLocationTracking } = useAuthSession();
  const [selectedDate, setSelectedDate] = useState<DateKey>(today);
  const [startingId, setStartingId] = useState<string | null>(null);

  // One query per visible month: it feeds both the calendar dots and the day list.
  const month = selectedDate.slice(0, 7);
  const filter = useMemo(() => {
    const range = visibleMonthRange(`${month}-01`);
    return { from: dayRange(range.from).from, to: dayRange(range.to).to };
  }, [month]);
  const { visits, isLoading } = useVisits(filter);
  const { visit: inProgress } = useVisitInProgress();
  const { syncNow, isSyncing } = useSyncNow();
  const { checkIn } = useCheckInVisit();

  const marks = useMemo(() => buildCalendarMarks(visits, colors), [visits, colors]);
  const dayVisits = useMemo(
    () => visits.filter((visit) => toDateKey(visit.scheduledAt) === selectedDate),
    [visits, selectedDate],
  );
  const summary = useMemo(() => summarizeDay(dayVisits), [dayVisits]);
  // The optimal route covers today's own pending visits.
  const hasRouteToday =
    selectedDate === today &&
    dayVisits.some((visit) => visit.isAssignedTo(user?.id) && isPendingForRoute(visit));

  const firstName = user?.name.split(' ')[0] ?? '';

  const openVisit = (visit: VisitEntity) =>
    router.push({ pathname: '/(app)/visit/[id]', params: { id: visit.id } });

  const canStartFromAgenda = (visit: VisitEntity) =>
    visit.canStart() &&
    visit.isAssignedTo(user?.id) &&
    toDateKey(visit.scheduledAt) <= today &&
    (!inProgress || inProgress.id === visit.id);

  const startVisit = async (visit: VisitEntity) => {
    if (startingId) return;
    if (inProgress && inProgress.id !== visit.id) {
      notify.error(new VisitAlreadyInProgressError(inProgress.id));
      return;
    }
    setStartingId(visit.id);
    try {
      const { reading } = await checkIn(visit.id);
      if (reading.ok || !canSeeLocationTracking) notify.success(es.visits.toasts.started);
      else notify.warning(es.visits.toasts.started, es.visits.gps.failures[reading.reason]);
      openVisit(visit);
    } catch (error) {
      notify.error(error);
    } finally {
      setStartingId(null);
    }
  };

  const newVisit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push({
      pathname: '/(app)/visit/new',
      params: { date: selectedDate < today ? today : selectedDate },
    });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={`${greeting(now)}${firstName ? `, ${firstName}` : ''}`}
        subtitle={formatDayLabel(selectedDate)}
        rightElement={
          <View className="flex-row items-center gap-2">
            {selectedDate !== today ? (
              <Pressable
                testID="agenda-go-today"
                accessibilityRole="button"
                onPress={() => setSelectedDate(today)}
                className="rounded-full border border-border px-3 py-1 active:bg-muted"
              >
                <Text className="text-xs font-semibold text-foreground">{es.agenda.goToToday}</Text>
              </Pressable>
            ) : null}
            <SyncStatusPill onPress={() => router.push('/(app)/sync')} />
          </View>
        }
      />
      <OfflineBanner />
      {inProgress ? <VisitInProgressBanner visit={inProgress} onPress={openVisit} /> : null}

      <View className="mt-3 flex-1">
        <AgendaCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} marks={marks}>
          {isLoading ? (
            <View className="gap-3 p-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </View>
          ) : (
            <FlatList
              data={dayVisits}
              keyExtractor={(visit) => visit.id}
              contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1, paddingBottom: 96 }}
              ListHeaderComponent={
                <View className="gap-3">
                  <AgendaSummary summary={summary} />
                  {hasRouteToday ? (
                    <Button
                      testID="agenda-optimal-route"
                      variant="outline"
                      leftIcon={<Route size={16} color={colors.foreground} />}
                      onPress={() => router.push('/(app)/route')}
                    >
                      {es.agenda.optimalRoute}
                    </Button>
                  ) : null}
                </View>
              }
              renderItem={({ item }) => (
                <VisitCard
                  visit={item}
                  onPress={openVisit}
                  onStart={canStartFromAgenda(item) ? startVisit : undefined}
                  isStarting={startingId === item.id}
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
                  actionLabel={es.agenda.newVisit}
                  onActionPress={newVisit}
                />
              }
            />
          )}
        </AgendaCalendar>
      </View>

      <Pressable
        testID="agenda-new-visit"
        accessibilityRole="button"
        accessibilityLabel={es.agenda.newVisit}
        onPress={newVisit}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg active:opacity-90"
      >
        <Plus size={26} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );
}
