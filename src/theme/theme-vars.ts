import { palette, type ColorSchemeName, type ThemePalette, type ThemeToken } from './palette';

export type ResolvedThemeColors = Readonly<Record<ThemeToken, string>>;

/** `visitOpportunity` → `visit-opportunity` (the CSS variable / Tailwind class name). */
export function toCssTokenName(token: ThemeToken): string {
  return token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** HSL triplet (`'0 84% 50%'`) → a color string React Native accepts. */
export function hslColor(triplet: string, alpha = 1): string {
  const [hue, saturation, lightness] = triplet.trim().split(/\s+/);
  return alpha >= 1
    ? `hsl(${hue}, ${saturation}, ${lightness})`
    : `hsla(${hue}, ${saturation}, ${lightness}, ${alpha})`;
}

/** CSS variables (`--primary: 0 84% 50%`) for NativeWind `vars()`. */
export function buildThemeVariables(scheme: ColorSchemeName): Record<string, string> {
  const tokens = palette[scheme];
  return Object.fromEntries(
    (Object.keys(tokens) as ThemeToken[]).map((token) => [
      `--${toCssTokenName(token)}`,
      tokens[token],
    ]),
  );
}

/** Ready-to-use colors for APIs that do not accept classes (icons, StatusBar, navigation). */
export function resolveThemeColors(scheme: ColorSchemeName): ResolvedThemeColors {
  const tokens: Readonly<ThemePalette> = palette[scheme];
  return Object.fromEntries(
    (Object.keys(tokens) as ThemeToken[]).map((token) => [token, hslColor(tokens[token])]),
  ) as ResolvedThemeColors;
}
