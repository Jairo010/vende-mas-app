import type { GeoPoint } from '@/core/types/geo.types';

/**
 * Decodes a Google encoded polyline (precision 5), as returned by the Routes API.
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): GeoPoint[] {
  const points: GeoPoint[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  const nextValue = (): number => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    latitude += nextValue();
    longitude += nextValue();
    points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }
  return points;
}

/** Inverse of `decodePolyline` (used to keep only the part of the route still ahead). */
export function encodePolyline(points: readonly GeoPoint[]): string {
  let encoded = '';
  let previousLatitude = 0;
  let previousLongitude = 0;

  const pushValue = (value: number) => {
    let rest = value < 0 ? ~(value << 1) : value << 1;
    while (rest >= 0x20) {
      encoded += String.fromCharCode((0x20 | (rest & 0x1f)) + 63);
      rest >>= 5;
    }
    encoded += String.fromCharCode(rest + 63);
  };

  for (const point of points) {
    const latitude = Math.round(point.latitude * 1e5);
    const longitude = Math.round(point.longitude * 1e5);
    pushValue(latitude - previousLatitude);
    pushValue(longitude - previousLongitude);
    previousLatitude = latitude;
    previousLongitude = longitude;
  }
  return encoded;
}
