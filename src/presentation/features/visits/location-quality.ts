import type { ThemeToken } from '@/theme';

export type LocationQuality = 'GOOD' | 'FAIR' | 'POOR';

/** GPS accuracy bands (meters) a supervisor can trust when reviewing visits. */
const GOOD_ACCURACY_METERS = 30;
const FAIR_ACCURACY_METERS = 100;

/** Distance to the store that is still "at the store" / "nearby". */
const AT_STORE_METERS = 100;
const NEARBY_METERS = 300;

export function locationQuality(accuracyMeters: number | null | undefined): LocationQuality | null {
  if (accuracyMeters === null || accuracyMeters === undefined) return null;
  if (accuracyMeters <= GOOD_ACCURACY_METERS) return 'GOOD';
  if (accuracyMeters <= FAIR_ACCURACY_METERS) return 'FAIR';
  return 'POOR';
}

export const LOCATION_QUALITY_TOKENS: Readonly<Record<LocationQuality, ThemeToken>> = {
  GOOD: 'success',
  FAIR: 'warning',
  POOR: 'destructive',
};

/** Color of the distance to the store: far check-ins stand out (GPS never blocks). */
export function distanceToken(meters: number): ThemeToken {
  if (meters <= AT_STORE_METERS) return 'success';
  if (meters <= NEARBY_METERS) return 'warning';
  return 'destructive';
}

/** `85 m` / `1,2 km` */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString('es-EC', { maximumFractionDigits: 1 })} km`;
}
