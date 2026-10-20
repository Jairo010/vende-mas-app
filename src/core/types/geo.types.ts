export interface GeoPoint {
  latitude: number;
  longitude: number;
  /** GPS accuracy reported by the device (meters). */
  accuracyMeters?: number;
}

/** Why the device could not give a position (the visit continues without it). */
export type LocationFailureReason =
  'PERMISSION_DENIED' | 'SERVICES_DISABLED' | 'TIMEOUT' | 'UNAVAILABLE';

/** Result of reading the GPS: GPS is recorded, never blocking. */
export type LocationReading =
  { ok: true; point: GeoPoint } | { ok: false; reason: LocationFailureReason };
