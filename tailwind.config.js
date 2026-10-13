/**
 * Colors are NOT defined here. Each class points to a CSS variable whose value lives in
 * `src/theme/palette.ts` and is applied at runtime by `ThemeProvider` (NativeWind `vars()`).
 * Only token names are listed; `__tests__/theme/palette.test.ts` checks they match the palette.
 */
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: token('background'),
        foreground: token('foreground'),
        card: { DEFAULT: token('card'), foreground: token('card-foreground') },
        popover: { DEFAULT: token('popover'), foreground: token('popover-foreground') },
        primary: { DEFAULT: token('primary'), foreground: token('primary-foreground') },
        secondary: { DEFAULT: token('secondary'), foreground: token('secondary-foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        accent: { DEFAULT: token('accent'), foreground: token('accent-foreground') },
        destructive: { DEFAULT: token('destructive'), foreground: token('destructive-foreground') },
        success: { DEFAULT: token('success'), foreground: token('success-foreground') },
        warning: { DEFAULT: token('warning'), foreground: token('warning-foreground') },
        info: { DEFAULT: token('info'), foreground: token('info-foreground') },
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        overlay: token('overlay'),
        visit: {
          opportunity: token('visit-opportunity'),
          order: token('visit-order'),
          collection: token('visit-collection'),
        },
        status: {
          scheduled: token('status-scheduled'),
          'in-progress': token('status-in-progress'),
          completed: token('status-completed'),
          cancelled: token('status-cancelled'),
        },
      },
      fontFamily: {
        sans: ['Inter'],
        heading: ['Inter'],
      },
    },
  },
  plugins: [],
};
