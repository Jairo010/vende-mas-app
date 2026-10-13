import type { Theme } from 'expo-router';
import type { ColorSchemeName } from './palette';
import { resolveThemeColors } from './theme-vars';
import { FONT_FAMILY } from './typography';

function buildNavigationTheme(scheme: ColorSchemeName): Theme {
  const colors = resolveThemeColors(scheme);
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

/** React Navigation themes derived from the same palette (headers, tab bar, screen background). */
export const NAVIGATION_THEMES: Readonly<Record<ColorSchemeName, Theme>> = {
  light: buildNavigationTheme('light'),
  dark: buildNavigationTheme('dark'),
};
