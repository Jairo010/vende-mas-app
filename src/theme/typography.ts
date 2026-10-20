/**
 * Inter is embedded natively by the `expo-font` config plugin (app.json) under this
 * single family, with one file per weight, so `fontWeight` / `font-semibold` select the
 * right file on both platforms.
 */
export const FONT_FAMILY = 'Inter';

export const typography = {
  fontFamilies: {
    sans: FONT_FAMILY,
    heading: FONT_FAMILY,
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;
