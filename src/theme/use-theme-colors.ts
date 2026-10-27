import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/stores/auth.store';
import { brandedPalette } from './brand';
import type { ColorSchemeName, ThemeToken } from './palette';
import { hslColor, resolveThemeColors, type ResolvedThemeColors } from './theme-vars';

/** Resolved once per scheme and brand (the brand changes only with the company). */
const RESOLVED_COLORS = new Map<string, ResolvedThemeColors>();

function resolvedColors(scheme: ColorSchemeName, brandColor: string | null): ResolvedThemeColors {
  const key = `${scheme}|${brandColor ?? ''}`;
  let colors = RESOLVED_COLORS.get(key);
  if (!colors) {
    colors = resolveThemeColors(scheme, brandColor);
    RESOLVED_COLORS.set(key, colors);
  }
  return colors;
}

/**
 * Effective scheme (`light` | `dark`), reactive to both the user preference and the OS
 * setting. Never read `Appearance.getColorScheme()` directly: it does not re-render.
 */
export function useAppColorScheme(): ColorSchemeName {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

/** Brand color of the session's company (`#rrggbb`), or null to keep the app palette. */
export function useBrandColor(): string | null {
  return useAuthStore((state) => state.user?.company?.brandColor ?? null);
}

/**
 * Resolved colors of the active theme (with the company brand), for what cannot take classes:
 * lucide icons, `RefreshControl`, placeholders, navigation options, bottom sheets.
 */
export function useThemeColors(): ResolvedThemeColors {
  return resolvedColors(useAppColorScheme(), useBrandColor());
}

/** A theme color with transparency, e.g. for tinted backgrounds drawn with `style`. */
export function useThemeColorWithAlpha(token: ThemeToken, alpha: number): string {
  return hslColor(brandedPalette(useAppColorScheme(), useBrandColor())[token], alpha);
}
