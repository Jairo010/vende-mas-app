import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VisitEntity } from '@/core/entities/visit.entity';
import type { ILocationPort } from '@/core/ports/location.port';
import type { IRouteOptimizerPort } from '@/core/ports/route-optimizer.port';
import type { GeoPoint } from '@/core/types/geo.types';
import type { RouteStop } from '@/core/types/route.types';
import { expoLocationAdapter } from '@/infrastructure/device/expo-location.adapter';
import { routeApiService } from '@/infrastructure/api/services/route-api.service';
import { useRoutePlanStore } from '@/stores/route-plan.store';
import { useNow } from '@/shared/hooks/use-now';
import { dayRange, toDateKey, todayKey } from '@/shared/utils/date';
import {
  dayRouteStops,
  orderedRouteVisits,
  reconcilePlan,
  withPostponedStops,
} from '../../route/route-plan';
import { useAuthSession } from '../auth/use-auth-session';
import { useVisits } from '../visits/use-visits';

/** Same set of stops (and store locations) ⇔ same key. */
function stopsKey(stops: readonly RouteStop[]): string {
  return stops
    .map(
      (stop) => `${stop.id}@${stop.point.latitude.toFixed(5)},${stop.point.longitude.toFixed(5)}`,
    )
    .sort()
    .join('|');
}

const customerPoint = (visit: VisitEntity | undefined): GeoPoint | null =>
  visit?.customer?.latitude != null && visit.customer.longitude != null
    ? { latitude: visit.customer.latitude, longitude: visit.customer.longitude }
    : null;

/**
 * Where the route starts when the GPS gives nothing: the store of the visit in progress, else
 * where the last visit of the day ended, else the first stop.
 */
function fallbackOrigin(visits: readonly VisitEntity[], stops: readonly RouteStop[]): GeoPoint {
  const inProgress = visits.find((visit) => visit.status === 'IN_PROGRESS');
  const lastDone = visits
    .filter((visit) => visit.status === 'COMPLETED' && visit.end)
    .sort((a, b) => (a.end!.at < b.end!.at ? 1 : -1))[0];
  return (
    customerPoint(inProgress) ??
    lastDone?.end?.location ??
    customerPoint(lastDone) ??
    stops[0].point
  );
}

/**
 * Optimal route of today's pending visits of the signed-in user.
 *
 * - Computed once (API → Google, or the device estimate offline) and saved for the day.
 * - Doing, cancelling or postponing visits only adjusts the saved plan: no new API call.
 * - A new stop or a store that moved recomputes from the current position, and so does "Recalcular".
 * - Visits left for later are never optimized: they go after the plan, estimated on the device.
 */
export function useRoutePlan(
  optimizer: IRouteOptimizerPort = routeApiService,
  location: ILocationPort = expoLocationAdapter,
) {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  const today = todayKey(useNow(60_000));
  const filter = useMemo(() => dayRange(today), [today]);
  const { visits, isLoading } = useVisits(filter);

  const todaysVisits = useMemo(
    () => visits.filter((visit) => toDateKey(visit.scheduledAt) === today),
    [visits, today],
  );
  const { stops, postponed, unlocated } = useMemo(
    () => dayRouteStops(todaysVisits, userId, today),
    [todaysVisits, userId, today],
  );
  const key = useMemo(() => stopsKey(stops), [stops]);

  const saved = useRoutePlanStore((state) => state.saved);
  const save = useRoutePlanStore((state) => state.save);
  const savedPlan = saved && saved.userId === userId && saved.date === today ? saved.plan : null;

  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Latest inputs for the async computation (effects only re-run when the key changes).
  // Synced in an effect declared before the one that computes, so it always runs first.
  const latest = useRef({ stops, todaysVisits, key, userId, today });
  useEffect(() => {
    latest.current = { stops, todaysVisits, key, userId, today };
  }, [stops, todaysVisits, key, userId, today]);
  const computing = useRef(false);

  const compute = useCallback(async (): Promise<void> => {
    const input = latest.current;
    if (computing.current || !input.userId || input.stops.length === 0) return;
    computing.current = true;
    setIsComputing(true);
    setError(null);
    try {
      const reading = await location.getCurrentPosition();
      const origin = reading.ok
        ? { latitude: reading.point.latitude, longitude: reading.point.longitude }
        : fallbackOrigin(input.todaysVisits, input.stops);
      const computed = await optimizer.optimize(origin, input.stops);
      save({ userId: input.userId, date: input.today, plan: computed });
    } catch (caught) {
      setError(caught);
    } finally {
      computing.current = false;
      setIsComputing(false);
    }
    // The visits changed while computing: the saved plan is already stale.
    if (latest.current.key !== input.key) void compute();
  }, [location, optimizer, save]);

  useEffect(() => {
    if (isLoading || !userId || stops.length === 0) return;
    if (!savedPlan) {
      void compute();
      return;
    }
    const result = reconcilePlan(savedPlan, stops);
    if (result.kind === 'trimmed' || result.kind === 'patched') {
      save({ userId, date: today, plan: result.plan });
    } else if (result.kind === 'recompute') void compute();
    // `key` stands for `stops` (a new array on every refetch); `savedPlan` changes only when saved.
  }, [key, isLoading, userId, today, savedPlan]);

  // Nothing to show until the plan of the regular stops exists, unless only postponed ones remain.
  const plan = useMemo(() => {
    if (postponed.length === 0) return stops.length > 0 ? savedPlan : null;
    if (stops.length === 0) {
      return withPostponedStops(null, postponed, fallbackOrigin(todaysVisits, postponed));
    }
    return savedPlan ? withPostponedStops(savedPlan, postponed, savedPlan.origin) : null;
  }, [savedPlan, stops, postponed, todaysVisits]);

  const items = useMemo(() => {
    if (!plan) return [];
    const pending = new Set([...stops, ...postponed].map((stop) => stop.id));
    return orderedRouteVisits(plan, todaysVisits).filter(({ visit }) => pending.has(visit.id));
  }, [plan, stops, postponed, todaysVisits]);

  return {
    plan,
    /** Pending visits in route order, with the leg that reaches each one. */
    items,
    /** Pending visits whose store has no location yet. */
    unlocated,
    hasStops: stops.length + postponed.length > 0,
    isLoading,
    isComputing,
    error,
    recompute: compute,
  };
}
