import type { VisitEntity } from '@/core/entities/visit.entity';
import type { GeoPoint } from '@/core/types/geo.types';
import type { RoutePlan, RouteStop } from '@/core/types/route.types';
import { distanceInMeters } from '@/core/value-objects/geo-distance';
import { toDateKey, type DateKey } from '@/shared/utils/date';
import { decodePolyline, encodePolyline } from '@/shared/utils/polyline';

/** Today's visits of the user still to do, split by whether the store has a location. */
export interface DayRouteStops {
  /** Visits with a store location: they make the route. */
  stops: RouteStop[];
  /** Stores without coordinates yet (pinned by their first check-in): listed apart. */
  unlocated: VisitEntity[];
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
  const unlocated: VisitEntity[] = [];
  for (const visit of visits) {
    if (!visit.isAssignedTo(userId) || !isPendingForRoute(visit)) continue;
    if (toDateKey(visit.scheduledAt) !== date) continue;
    const customer = visit.customer;
    if (customer?.latitude != null && customer.longitude != null) {
      stops.push({
        id: visit.id,
        point: { latitude: customer.latitude, longitude: customer.longitude },
      });
    } else {
      unlocated.push(visit);
    }
  }
  return { stops, unlocated };
}

const samePoint = (a: GeoPoint, b: GeoPoint) =>
  Math.abs(a.latitude - b.latitude) < 1e-6 && Math.abs(a.longitude - b.longitude) < 1e-6;

/**
 * How the saved plan relates to the visits still pending:
 * - `same`: nothing changed.
 * - `trimmed`: the first stops of the plan were done (the suggested order was followed). The
 *   rest of an optimal open route stays optimal, so the plan is cut there without asking the
 *   API (and Google) again.
 * - `recompute`: a visit was added, cancelled or done out of order, or a store moved.
 */
export type PlanReconciliation =
  { kind: 'same'; plan: RoutePlan } | { kind: 'trimmed'; plan: RoutePlan } | { kind: 'recompute' };

export function reconcilePlan(plan: RoutePlan, stops: readonly RouteStop[]): PlanReconciliation {
  const legById = new Map(plan.legs.map((leg) => [leg.stopId, leg]));
  for (const stop of stops) {
    const leg = legById.get(stop.id);
    if (!leg || !samePoint(leg.point, stop.point)) return { kind: 'recompute' };
  }

  const pending = new Set(stops.map((stop) => stop.id));
  const firstPending = plan.legs.findIndex((leg) => pending.has(leg.stopId));
  const doneCount = firstPending === -1 ? plan.legs.length : firstPending;

  // Only the leading stops may be gone: a gap in the middle means a change of plans.
  const remaining = plan.legs.slice(doneCount);
  if (remaining.length !== stops.length) return { kind: 'recompute' };
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
