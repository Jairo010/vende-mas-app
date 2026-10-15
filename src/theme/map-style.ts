import { palette, type ColorSchemeName } from './palette';
import { hexColor } from './theme-vars';

/** Google Maps styling rule (`customMapStyle` of react-native-maps on Android). */
export interface MapStyleRule {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string>>;
}

/**
 * Google Maps has no dark mode of its own on Android: the dark theme paints it with the
 * palette (iOS / Apple Maps follows `userInterfaceStyle`). Light keeps Google's default style.
 */
export function googleMapStyle(scheme: ColorSchemeName): MapStyleRule[] {
  if (scheme === 'light') return [];
  const tokens = palette.dark;
  const color = (triplet: string) => [{ color: hexColor(triplet) }];

  return [
    { elementType: 'geometry', stylers: color(tokens.card) },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: color(tokens.mutedForeground) },
    { elementType: 'labels.text.stroke', stylers: color(tokens.background) },
    { featureType: 'administrative', elementType: 'geometry', stylers: color(tokens.border) },
    { featureType: 'poi', elementType: 'geometry', stylers: color(tokens.muted) },
    { featureType: 'road', elementType: 'geometry.fill', stylers: color(tokens.muted) },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: color(tokens.border) },
    { featureType: 'road.highway', elementType: 'geometry.fill', stylers: color(tokens.border) },
    { featureType: 'transit', elementType: 'geometry', stylers: color(tokens.muted) },
    { featureType: 'water', elementType: 'geometry', stylers: color(tokens.background) },
  ];
}
