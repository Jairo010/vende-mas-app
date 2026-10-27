import { palette, type ColorSchemeName, type ThemePalette } from './palette';

const HEX = /^#([0-9a-f]{6})$/i;
/** On dark backgrounds a dark brand color would vanish: it is lifted to at least this. */
const MIN_DARK_LIGHTNESS = 55;

/** `#rrggbb` → `[h, s, l]` (degrees, %, %). */
function hexToHsl(hex: string): [number, number, number] | null {
  const match = HEX.exec(hex);
  if (!match?.[1]) return null;
  const value = parseInt(match[1], 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) * 60
      : max === g
        ? ((b - r) / d + 2) * 60
        : ((r - g) / d + 4) * 60;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/** WCAG relative luminance of an HSL color (0 black … 1 white). */
function luminance(h: number, s: number, l: number): number {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const value = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4);
}

/**
 * The company's brand color as the primary of the app (buttons, active tab, links), with a
 * readable text color on top. `null` (no brand) leaves the palette untouched.
 */
export function brandOverrides(
  brandColor: string | null,
  scheme: ColorSchemeName,
): Partial<ThemePalette> {
  const hsl = brandColor ? hexToHsl(brandColor) : null;
  if (!hsl) return {};
  const [h, s, l] = hsl;
  const lightness = scheme === 'dark' ? Math.max(l, MIN_DARK_LIGHTNESS) : l;
  const primary = `${h} ${s}% ${lightness}%`;
  // White text unless the brand is light (yellows, light blues…).
  const onPrimary = luminance(h, s, lightness) > 0.45 ? '0 0% 9%' : '0 0% 100%';
  return { primary, ring: primary, primaryForeground: onPrimary };
}

/** The palette of a scheme with the company brand applied. */
export function brandedPalette(
  scheme: ColorSchemeName,
  brandColor: string | null,
): Readonly<ThemePalette> {
  return { ...palette[scheme], ...brandOverrides(brandColor, scheme) };
}
