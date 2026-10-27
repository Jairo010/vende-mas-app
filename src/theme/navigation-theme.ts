import type { Theme } from 'expo-router';
import type { ColorSchemeName } from './palette';
import { resolveThemeColors } from './theme-vars';
import { FONT_FAMILY } from './typography';

/** React Navigation theme (headers, tab bar, screen background) from the same palette and brand. */
export function buildNavigationTheme(
  scheme: ColorSchemeName,
  brandColor: string | null = null,
): Theme {
  const colors = resolveThemeColors(scheme, brandColor);
  return {
    dark: scheme === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.foreground,
      border: colors.border,
      notification: colors.primary,
    },
    fonts: {
      regular: { fontFamily: FONT_FAMILY, fontWeight: '400' },
      medium: { fontFamily: FONT_FAMILY, fontWeight: '500' },
      bold: { fontFamily: FONT_FAMILY, fontWeight: '600' },
      heavy: { fontFamily: FONT_FAMILY, fontWeight: '700' },
    },
  };
}
