import type { GeoPoint } from '@/core/types/geo.types';

/** Google Maps URLs accept at most 9 waypoints between the origin and the destination. */
export const MAX_DIRECTIONS_WAYPOINTS = 9;

const coordinate = (point: GeoPoint) => `${point.latitude},${point.longitude}`;

/**
 * Pin on Google Maps (app if installed, browser otherwise). Maps URLs need no API key and are
 * free: https://developers.google.com/maps/documentation/urls/get-started
 */
export function googleMapsPlaceUrl(point: GeoPoint): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinate(point))}`;
}

/**
 * Driving directions from the current position through the stops, in order. Only the first
 * 10 stops fit (9 waypoints + destination); `navigate` starts turn-by-turn right away.
 */
export function googleMapsDirectionsUrl(
  stops: readonly GeoPoint[],
  { navigate = false }: { navigate?: boolean } = {},
): string | null {
  const route = stops.slice(0, MAX_DIRECTIONS_WAYPOINTS + 1);
  const destination = route[route.length - 1];
  if (!destination) return null;

  const params = [
    'api=1',
    `destination=${encodeURIComponent(coordinate(destination))}`,
    'travelmode=driving',
  ];
  const waypoints = route.slice(0, -1);
  if (waypoints.length > 0) {
    params.push(`waypoints=${encodeURIComponent(waypoints.map(coordinate).join('|'))}`);
  }
  if (navigate) params.push('dir_action=navigate');
  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}
