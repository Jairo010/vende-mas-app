/** `POST /api/v1/routes/optimize` body. */
export interface OptimizeRouteRequestDto {
  origin: { latitude: number; longitude: number };
  /** Pending visits of the day (visit id + store location). */
  stops: Array<{ id: string; latitude: number; longitude: number }>;
}

/** `POST /api/v1/routes/optimize` response. */
export interface RoutePlanResponseDto {
  provider: 'GOOGLE' | 'ESTIMATE';
  orderedStopIds: string[];
  legs: Array<{ stopId: string; distanceMeters: number; durationSeconds: number }>;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  encodedPolyline: string | null;
  computedAt: string;
}
