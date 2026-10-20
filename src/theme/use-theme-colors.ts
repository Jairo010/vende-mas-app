import { useColorScheme } from 'nativewind';
import { palette, type ColorSchemeName, type ThemeToken } from './palette';
import { hslColor, resolveThemeColors, type ResolvedThemeColors } from './theme-vars';

const RESOLVED_COLORS: Readonly<Record<ColorSchemeName, ResolvedThemeColors>> = {
  light: resolveThemeColors('light'),
  dark: resolveThemeColors('dark'),
};

/**
 * Effective scheme (`light` | `dark`), reactive to both the user preference and the OS
 * setting. Never read `Appearance.getColorScheme()` directly: it does not re-render.
 */
export function useAppColorScheme(): ColorSchemeName {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

/**
 * Resolved colors of the active theme, for what cannot take classes: lucide icons,
 * `RefreshControl`, placeholders, navigation options, bottom sheets.
 */
export function useThemeColors(): ResolvedThemeColors {
  return RESOLVED_COLORS[useAppColorScheme()];
}

/** A theme color with transparency, e.g. for tinted backgrounds drawn with `style`. */
export function useThemeColorWithAlpha(token: ThemeToken, alpha: number): string {
  return hslColor(palette[useAppColorScheme()][token], alpha);
}
