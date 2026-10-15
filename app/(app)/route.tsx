import { useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPinOff, Route } from 'lucide-react-native';
import { useAuthSession } from '@/application/hooks/auth/use-auth-session';
import { useRoutePlan } from '@/application/hooks/route/use-route-plan';
import { useCheckInVisit } from '@/application/hooks/visits/use-check-in-visit';
import { useVisitInProgress } from '@/application/hooks/visits/use-visit-in-progress';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { VisitAlreadyInProgressError } from '@/core/errors/visit.errors';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { OfflineBanner } from '@/presentation/components/feedback/offline-banner';
import { notify } from '@/presentation/components/feedback/toast';
import { Card } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { RouteMap } from '@/presentation/features/route/route-map';
import { RouteStopRow } from '@/presentation/features/route/route-stop-row';
import { RouteSummaryCard } from '@/presentation/features/route/route-summary-card';
import { ENV } from '@/shared/config/env.config';
import { es } from '@/shared/i18n/es';
import { formatDayLabel, todayKey } from '@/shared/utils/date';
import { googleMapsDirectionsUrl } from '@/shared/utils/maps-links';
import { useThemeColors } from '@/theme';

/**
 * Optimal route of today's pending visits: map with the numbered stops and the drive, the
 * order with travel times, and shortcuts to navigate with Google Maps. The plan is trimmed as
 * visits are done in order and recomputed when the day changes (see `useRoutePlan`).
 */
export default function RouteScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, canSeeLocationTracking } = useAuthSession();
  const { plan, items, unlocated, hasStops, isLoading, isComputing, error, recompute } =
    useRoutePlan();
  const { visit: inProgress } = useVisitInProgress();
  const { checkIn } = useCheckInVisit();
  const [startingId, setStartingId] = useState<string | null>(null);

  const openVisit = (visit: VisitEntity) =>
    router.push({ pathname: '/(app)/visit/[id]', params: { id: visit.id } });

  const openInGoogleMaps = (navigate: boolean) => {
    const points = (navigate ? items.slice(0, 1) : items).map((item) => item.leg.point);
    const url = googleMapsDirectionsUrl(points, { navigate });
    if (url) Linking.openURL(url).catch(() => {});
  };

  const next = items[0]?.visit;
  const canStartNext =
    next !== undefined &&
    next.canStart() &&
    next.isAssignedTo(user?.id) &&
    (!inProgress || inProgress.id === next.id);

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
    } catch (caught) {
      notify.error(caught);
    } finally {
      setStartingId(null);
    }
  };

  const content = (() => {
    // Until the first plan arrives (or fails), the route is being computed.
    if (isLoading || (hasStops && !plan && !error)) {
      return (
        <View className="gap-3 p-4">
          <Text className="text-center text-sm text-muted-foreground">{es.route.computing}</Text>
          <Skeleton className="h-64" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </View>
      );
    }

    if (!hasStops && unlocated.length === 0) {
      return (
        <EmptyState
          icon={<Route size={32} color={colors.mutedForeground} />}
          title={es.route.emptyTitle}
          description={es.route.emptyDescription}
        />
      );
    }

    if (hasStops && !plan) {
      return (
        <EmptyState
          icon={<Route size={32} color={colors.mutedForeground} />}
          title={es.route.errorTitle}
          actionLabel={es.route.retry}
          onActionPress={() => void recompute()}
        />
      );
    }

    return (
      <View className="flex-1">
        {/* Without a Maps key (Android build) the list and Google Maps shortcuts still work. */}
        {plan && ENV.MAPS_AVAILABLE ? (
          <View style={{ height: '42%' }}>
            <RouteMap plan={plan} items={items} onSelect={openVisit} />
          </View>
        ) : null}

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          {plan ? (
            <RouteSummaryCard
              plan={plan}
              isComputing={isComputing}
              onRecompute={() => void recompute()}
              onNavigateNext={() => openInGoogleMaps(true)}
              onOpenFullRoute={() => openInGoogleMaps(false)}
            />
          ) : null}

          {items.map(({ visit, leg, position }, index) => (
            <RouteStopRow
              key={visit.id}
              position={position}
              visit={visit}
              leg={leg}
              isNext={index === 0}
              onPress={openVisit}
              onStart={index === 0 && canStartNext ? startVisit : undefined}
              isStarting={startingId === visit.id}
            />
          ))}

          {unlocated.length > 0 ? (
            <Card className="gap-2 p-4">
              <View className="flex-row items-center">
                <MapPinOff size={16} color={colors.mutedForeground} />
                <Text className="ml-2 text-sm font-semibold text-foreground">
                  {es.route.unlocatedTitle}
                </Text>
              </View>
              <Text className="text-xs leading-4 text-muted-foreground">
                {es.route.unlocatedDescription}
              </Text>
              {unlocated.map((visit) => (
                <Text
                  key={visit.id}
                  testID={`route-unlocated-${visit.id}`}
                  className="text-sm text-foreground"
                  onPress={() => openVisit(visit)}
                >
                  • {visit.customer?.tradeName ?? '—'}
                </Text>
              ))}
            </Card>
          ) : null}
        </ScrollView>
      </View>
    );
  })();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={es.route.title}
        subtitle={formatDayLabel(todayKey())}
        onBack={() => router.back()}
      />
      <OfflineBanner />
      {content}
    </View>
  );
}
