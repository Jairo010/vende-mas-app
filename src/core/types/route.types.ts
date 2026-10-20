import type { GeoPoint } from './geo.types';

/** GOOGLE: real streets and live traffic. ESTIMATE: ordered on straight lines (offline or limit). */
export type RouteProvider = 'GOOGLE' | 'ESTIMATE';

/** A visit to make today, at its store location. `id` is the visit id. */
export interface RouteStop {
  id: string;
  point: GeoPoint;
}

/** Travel to a stop from the previous one (or from the origin, for the first stop). */
export interface RouteLeg {
  stopId: string;
  /** Where the stop is (kept so the plan can be trimmed as visits are done). */
  point: GeoPoint;
  distanceMeters: number;
  durationSeconds: number;
}

/** Optimal open route of the day: from `origin`, through `legs` in order. */
export interface RoutePlan {
  provider: RouteProvider;
  origin: GeoPoint;
  legs: RouteLeg[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  /** Google encoded polyline of the drive; null for an estimated route (straight lines). */
  encodedPolyline: string | null;
  /** ISO instant. */
  computedAt: string;
}
