import { palette, type ThemeToken } from '@/theme/palette';
import {
  buildThemeVariables,
  hslColor,
  resolveThemeColors,
  toCssTokenName,
} from '@/theme/theme-vars';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindConfig = require('../../tailwind.config.js') as {
  theme: { extend: { colors: Record<string, string | Record<string, string>> } };
};

/** CSS variable names referenced by tailwind.config.js (`hsl(var(--name) / <alpha-value>)`). */
function tailwindVariables(): string[] {
  const values: string[] = [];
  const walk = (node: string | Record<string, string>) => {
    if (typeof node === 'string') values.push(node);
    else Object.values(node).forEach(walk);
  };
  Object.values(tailwindConfig.theme.extend.colors).forEach(walk);
  return values.map((value) => /var\(--([a-z-]+)\)/.exec(value)?.[1] ?? value).sort();
}

describe('palette (single source of colors)', () => {
  it('defines exactly the same tokens for light and dark', () => {
    expect(Object.keys(palette.dark).sort()).toEqual(Object.keys(palette.light).sort());
  });

  it('stores every value as an HSL triplet', () => {
    for (const scheme of ['light', 'dark'] as const) {
      for (const value of Object.values(palette[scheme])) {
        expect(value).toMatch(/^\d{1,3} \d{1,3}% \d{1,3}%$/);
      }
    }
  });

  it('is fully wired into tailwind.config.js and nothing else is', () => {
    const tokens = (Object.keys(palette.light) as ThemeToken[]).map(toCssTokenName).sort();
    expect(tailwindVariables()).toEqual(tokens);
  });

  it('builds the CSS variables applied by ThemeProvider', () => {
    const variables = buildThemeVariables('dark');
    expect(variables['--primary']).toBe(palette.dark.primary);
    expect(variables['--visit-opportunity']).toBe(palette.dark.visitOpportunity);
    expect(Object.keys(variables)).toHaveLength(Object.keys(palette.dark).length);
  });

  it('resolves colors for APIs that do not take classes', () => {
    expect(hslColor('0 84% 50%')).toBe('hsl(0, 84%, 50%)');
    expect(hslColor('0 84% 50%', 0.2)).toBe('hsla(0, 84%, 50%, 0.2)');
    expect(resolveThemeColors('light').background).toBe(hslColor(palette.light.background));
    expect(toCssTokenName('statusInProgress')).toBe('status-in-progress');
  });
});
