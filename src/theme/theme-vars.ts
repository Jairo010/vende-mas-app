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

/** HSL triplet (`'0 84% 50%'`) → `#rrggbb`, for APIs that only take hex (Google map styles). */
export function hexColor(triplet: string): string {
  const [hue, saturation, lightness] = triplet
    .trim()
    .split(/\s+/)
    .map((part) => parseFloat(part));
  const l = lightness / 100;
  const a = (saturation / 100) * Math.min(l, 1 - l);
  // Standard HSL → RGB: f(n) = l − a·max(−1, min(k − 3, 9 − k, 1)), k = (n + h/30) mod 12.
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
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
