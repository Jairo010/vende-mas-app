import type { GeoPoint } from '../types/geo.types';
import type { RouteLeg, RoutePlan, RouteStop } from '../types/route.types';
import { distanceInMeters } from './geo-distance';

/** Streets are longer than the straight line between two points (urban detour factor). */
const ROAD_FACTOR = 1.3;
/** Average urban driving speed used for estimated times (25 km/h). */
const AVERAGE_SPEED_METERS_PER_SECOND = 25_000 / 3_600;
const MAX_IMPROVEMENT_PASSES = 100;
const EPSILON = 1e-6;

/**
 * Open route (fixed start, free end) over straight-line distances: nearest neighbour, then
 * 2-opt and Or-opt until no move shortens it. Same algorithm as the API (route-planning
 * module), used when the device is offline.
 */
export function solveOpenRoute(origin: GeoPoint, stops: readonly RouteStop[]): RouteStop[] {
  if (stops.length <= 1) return [...stops];

  const points = [origin, ...stops.map((stop) => stop.point)];
  const distance = points.map((from) => points.map((to) => distanceInMeters(from, to)));
  const length = (path: readonly number[]): number => {
    let total = 0;
    for (let i = 1; i < path.length; i++) total += distance[path[i - 1]][path[i]];
    return total;
  };

  let path = nearestNeighbour(distance);
  let best = length(path);

  for (let pass = 0; pass < MAX_IMPROVEMENT_PASSES; pass++) {
    const improved = twoOpt(path, best, length) ?? orOpt(path, best, length);
    if (!improved) break;
    ({ path, length: best } = improved);
  }

  return path.slice(1).map((index) => stops[index - 1]);
}

/** Estimated plan for stops already in visiting order (straight lines × road factor). */
export function estimateRoute(
  origin: GeoPoint,
  orderedStops: readonly RouteStop[],
  now: Date = new Date(),
): RoutePlan {
  let previous = origin;
  const legs: RouteLeg[] = orderedStops.map((stop) => {
    const distanceMeters = Math.round(distanceInMeters(previous, stop.point) * ROAD_FACTOR);
    previous = stop.point;
    return {
      stopId: stop.id,
      point: stop.point,
      distanceMeters,
      durationSeconds: Math.round(distanceMeters / AVERAGE_SPEED_METERS_PER_SECOND),
    };
  });

  return {
    provider: 'ESTIMATE',
    origin,
    legs,
    totalDistanceMeters: legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
    totalDurationSeconds: legs.reduce((sum, leg) => sum + leg.durationSeconds, 0),
    encodedPolyline: null,
    computedAt: now.toISOString(),
  };
}

/** Path of point indexes starting at the origin (0), always moving to the closest unvisited. */
function nearestNeighbour(distance: readonly number[][]): number[] {
  const path = [0];
  const pending = new Set(distance.keys());
  pending.delete(0);
  while (pending.size > 0) {
    const current = path[path.length - 1];
    let next = -1;
    for (const candidate of pending) {
      if (next === -1 || distance[current][candidate] < distance[current][next]) next = candidate;
    }
    path.push(next);
    pending.delete(next);
  }
  return path;
}

interface Improvement {
  readonly path: number[];
  readonly length: number;
}

/** First segment reversal that shortens the route (the origin never moves). */
function twoOpt(
  path: readonly number[],
  current: number,
  length: (path: readonly number[]) => number,
): Improvement | null {
  for (let i = 1; i < path.length - 1; i++) {
    for (let j = i + 1; j < path.length; j++) {
      const candidate = [
        ...path.slice(0, i),
        ...path.slice(i, j + 1).reverse(),
        ...path.slice(j + 1),
      ];
      const candidateLength = length(candidate);
      if (candidateLength < current - EPSILON) return { path: candidate, length: candidateLength };
    }
  }
  return null;
}

/** First move of a run of 1–3 stops (as is or reversed) elsewhere that shortens the route. */
function orOpt(
  path: readonly number[],
  current: number,
  length: (path: readonly number[]) => number,
): Improvement | null {
  for (let size = 1; size <= 3; size++) {
    for (let start = 1; start + size <= path.length; start++) {
      const segment = path.slice(start, start + size);
      const rest = [...path.slice(0, start), ...path.slice(start + size)];
      for (let at = 1; at <= rest.length; at++) {
        if (at === start) continue;
        for (const piece of size > 1 ? [segment, [...segment].reverse()] : [segment]) {
          const candidate = [...rest.slice(0, at), ...piece, ...rest.slice(at)];
          const candidateLength = length(candidate);
          if (candidateLength < current - EPSILON) {
            return { path: candidate, length: candidateLength };
          }
        }
      }
    }
  }
  return null;
}
