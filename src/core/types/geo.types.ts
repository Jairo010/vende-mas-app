export interface GeoPoint {
  latitude: number;
  longitude: number;
  /** GPS accuracy reported by the device (meters). */
  accuracyMeters?: number;
}
