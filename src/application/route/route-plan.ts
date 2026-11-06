import type { VisitEntity } from '@/core/entities/visit.entity';
import type { GeoPoint } from '@/core/types/geo.types';
import type { RouteLeg, RoutePlan, RouteStop } from '@/core/types/route.types';
import { distanceInMeters } from '@/core/value-objects/geo-distance';
import { estimateRoute } from '@/core/value-objects/open-route-heuristic';
import { toDateKey, type DateKey } from '@/shared/utils/date';
import { decodePolyline, encodePolyline } from '@/shared/utils/polyline';

/** Today's visits of the user still to do, split by whether the store has a location. */
export interface DayRouteStops {
  /** Visits with a store location: they make the route. */
  stops: RouteStop[];
  /** Same, but left for later today: they go last, first asked first (never optimized). */
  postponed: RouteStop[];
  /** Stores without coordinates yet (pinned by their first check-in): listed apart. */
  unlocated: VisitEntity[];
}

/** Left for later on that local day: it goes last on the route. Worth nothing on later days. */
export function isPostponedOn(visit: VisitEntity, date: DateKey): boolean {
  return visit.postponedAt !== null && !visit.isClosed() && toDateKey(visit.postponedAt) === date;
}

export function isPendingForRoute(visit: VisitEntity): boolean {
  return visit.status === 'SCHEDULED' || visit.status === 'IN_PROGRESS';
}

export function dayRouteStops(
  visits: readonly VisitEntity[],
  userId: string | null | undefined,
  date: DateKey,
): DayRouteStops {
  const stops: RouteStop[] = [];
  const later: { stop: RouteStop; at: string }[] = [];
  const unlocated: VisitEntity[] = [];
  for (const visit of visits) {
    if (!visit.isAssignedTo(userId) || !isPendingForRoute(visit)) continue;
    if (toDateKey(visit.scheduledAt) !== date) continue;
    const customer = visit.customer;
    if (customer?.latitude != null && customer.longitude != null) {
      const stop = {
        id: visit.id,
        point: { latitude: customer.latitude, longitude: customer.longitude },
      };
      if (isPostponedOn(visit, date)) later.push({ stop, at: visit.postponedAt ?? '' });
      else stops.push(stop);
    } else {
      unlocated.push(visit);
    }
  }
  later.sort((a, b) => a.at.localeCompare(b.at));
  return { stops, postponed: later.map((item) => item.stop), unlocated };
}

const samePoint = (a: GeoPoint, b: GeoPoint) =>
  Math.abs(a.latitude - b.latitude) < 1e-6 && Math.abs(a.longitude - b.longitude) < 1e-6;

/**
 * How the saved plan relates to the visits still pending:
 * - `same`: nothing changed.
 * - `trimmed`: the first stops of the plan were done (the suggested order was followed). The
 *   rest of an optimal open route stays optimal, so the plan is cut there without asking the
 *   API (and Google) again.
 * - `patched`: a stop in the middle is gone (done out of order, cancelled, left for later). The
 *   rest keeps its order and the gap is estimated on the device: nothing is worth a paid call.
 * - `recompute`: a new stop appeared or a store moved: only the API can place it.
 */
export type PlanReconciliation =
  | { kind: 'same'; plan: RoutePlan }
  | { kind: 'trimmed'; plan: RoutePlan }
  | { kind: 'patched'; plan: RoutePlan }
  | { kind: 'recompute' };

export function reconcilePlan(plan: RoutePlan, stops: readonly RouteStop[]): PlanReconciliation {
  const legById = new Map(plan.legs.map((leg) => [leg.stopId, leg]));
  for (const stop of stops) {
    const leg = legById.get(stop.id);
    if (!leg || !samePoint(leg.point, stop.point)) return { kind: 'recompute' };
  }

  const pending = new Set(stops.map((stop) => stop.id));
  const firstPending = plan.legs.findIndex((leg) => pending.has(leg.stopId));
  const doneCount = firstPending === -1 ? plan.legs.length : firstPending;

  const remaining = plan.legs.slice(doneCount);
  if (remaining.length !== stops.length) {
    return { kind: 'patched', plan: patchGaps(plan, pending, doneCount) };
  }
  if (doneCount === 0) return { kind: 'same', plan };

  const lastDone = plan.legs[doneCount - 1].point;
  return {
    kind: 'trimmed',
    plan: {
      ...plan,
      origin: lastDone,
      legs: remaining,
      totalDistanceMeters: remaining.reduce((sum, leg) => sum + leg.distanceMeters, 0),
      totalDurationSeconds: remaining.reduce((sum, leg) => sum + leg.durationSeconds, 0),
      encodedPolyline: plan.encodedPolyline ? trimPolyline(plan.encodedPolyline, lastDone) : null,
    },
  };
}

/** Removes the stops no longer pending and estimates the legs that had one of them before. */
function patchGaps(plan: RoutePlan, pending: ReadonlySet<string>, doneCount: number): RoutePlan {
  const origin = doneCount > 0 ? plan.legs[doneCount - 1].point : plan.origin;
  const legs: RouteLeg[] = [];
  let previous = origin;
  let afterGap = false;
  for (const leg of plan.legs.slice(doneCount)) {
    if (!pending.has(leg.stopId)) {
      afterGap = true;
      continue;
    }
    const stop = { id: leg.stopId, point: leg.point };
    legs.push(afterGap ? estimateRoute(previous, [stop]).legs[0] : leg);
    previous = leg.point;
    afterGap = false;
  }
  return {
    ...plan,
    // Part of it is no longer what the provider computed, and its polyline goes through the gap.
    provider: 'ESTIMATE',
    origin,
    legs,
    totalDistanceMeters: legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
    totalDurationSeconds: legs.reduce((sum, leg) => sum + leg.durationSeconds, 0),
    encodedPolyline: null,
  };
}

/**
 * The route the seller sees: the optimized plan and, after it, the visits left for later, with
 * legs estimated on the device. No call to the API: leaving a visit for later must not cost one.
 * Without a plan (only postponed visits left) the route starts at `origin`.
 */
export function withPostponedStops(
  plan: RoutePlan | null,
  postponed: readonly RouteStop[],
  origin: GeoPoint,
): RoutePlan | null {
  if (postponed.length === 0) return plan;
  const later = new Set(postponed.map((stop) => stop.id));
  // A visit just left for later may still be in the saved plan until it is reconciled.
  const legs = (plan?.legs ?? []).filter((leg) => !later.has(leg.stopId));
  const from = legs.length > 0 ? legs[legs.length - 1].point : (plan?.origin ?? origin);
  const tail = estimateRoute(from, postponed);
  const all = [...legs, ...tail.legs];
  return {
    ...tail,
    ...plan,
    origin: plan?.origin ?? origin,
    legs: all,
    totalDistanceMeters: all.reduce((sum, leg) => sum + leg.distanceMeters, 0),
    totalDurationSeconds: all.reduce((sum, leg) => sum + leg.durationSeconds, 0),
    postponedFrom: legs.length,
  };
}

/** Keeps the part of the drawn route after the point closest to `from` (the last stop done). */
function trimPolyline(encoded: string, from: GeoPoint): string | null {
  const points = decodePolyline(encoded);
  if (points.length < 2) return null;
  let closest = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    const distance = distanceInMeters(point, from);
    if (distance < closestDistance) {
      closest = index;
      closestDistance = distance;
    }
  });
  const ahead = points.slice(closest);
  return ahead.length >= 2 ? encodePolyline(ahead) : null;
}

/** The plan's visits in order, joined with the visit data (stops no longer pending are left out). */
export function orderedRouteVisits(
  plan: RoutePlan,
  visits: readonly VisitEntity[],
): Array<{ visit: VisitEntity; leg: RoutePlan['legs'][number]; position: number }> {
  const byId = new Map(visits.map((visit) => [visit.id, visit]));
  return plan.legs.flatMap((leg, index) => {
    const visit = byId.get(leg.stopId);
    return visit ? [{ visit, leg, position: index + 1 }] : [];
  });
}
