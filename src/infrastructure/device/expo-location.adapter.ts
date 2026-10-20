import * as Location from 'expo-location';
import type { ILocationPort } from '@/core/ports/location.port';
import type { GeoPoint, LocationReading } from '@/core/types/geo.types';

/** Give up on a fresh fix after this long (inside shops the GPS can take a while). */
export const LOCATION_TIMEOUT_MS = 15_000;
/** A cached fix this recent is good enough when a fresh one does not arrive in time. */
const LAST_KNOWN_MAX_AGE_MS = 2 * 60_000;

const TIMEOUT = Symbol('timeout');

function toPoint(location: Location.LocationObject): GeoPoint {
  const { latitude, longitude, accuracy } = location.coords;
  return {
    latitude,
    longitude,
    ...(accuracy !== null && accuracy !== undefined && { accuracyMeters: Math.round(accuracy) }),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | typeof TIMEOUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMEOUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMEOUT), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function lastKnown(): Promise<GeoPoint | null> {
  try {
    const location = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS });
    return location ? toPoint(location) : null;
  } catch {
    return null;
  }
}

/**
 * GPS through expo-location (foreground permission only). Asks for permission on first
 * use, falls back to a recent cached fix on timeout and never throws.
 */
export const expoLocationAdapter: ILocationPort = {
  getCurrentPosition: async (): Promise<LocationReading> => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return { ok: false, reason: 'PERMISSION_DENIED' };

      if (!(await Location.hasServicesEnabledAsync())) {
        return { ok: false, reason: 'SERVICES_DISABLED' };
      }

      const fresh = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        LOCATION_TIMEOUT_MS,
      );
      if (fresh !== TIMEOUT) return { ok: true, point: toPoint(fresh) };

      const cached = await lastKnown();
      return cached ? { ok: true, point: cached } : { ok: false, reason: 'TIMEOUT' };
    } catch {
      const cached = await lastKnown();
      return cached ? { ok: true, point: cached } : { ok: false, reason: 'UNAVAILABLE' };
    }
  },
};
