import { brandedPalette, brandOverrides } from '@/theme/brand';
import { palette } from '@/theme/palette';
import { buildThemeVariables } from '@/theme/theme-vars';

describe('company brand color', () => {
  it('replaces primary and ring, keeping every other token of the palette', () => {
    const branded = brandedPalette('light', '#1D4ED8');

    expect(branded.primary).toBe('224 76% 48%');
    expect(branded.ring).toBe(branded.primary);
    expect(branded.background).toBe(palette.light.background);
    expect(buildThemeVariables('light', '#1D4ED8')['--primary']).toBe('224 76% 48%');
  });

  it('puts white text on dark brands and dark text on light ones', () => {
    expect(brandOverrides('#1D4ED8', 'light').primaryForeground).toBe('0 0% 100%');
    expect(brandOverrides('#FACC15', 'light').primaryForeground).toBe('0 0% 9%');
  });

  it('lifts a dark brand on dark backgrounds so it stays visible', () => {
    expect(brandOverrides('#1E3A8A', 'dark').primary).toBe('224 64% 55%');
  });

  it('leaves the palette untouched without a valid brand', () => {
    expect(brandOverrides(null, 'light')).toEqual({});
    expect(brandOverrides('blue', 'dark')).toEqual({});
    expect(brandedPalette('dark', null)).toEqual(palette.dark);
  });
});
