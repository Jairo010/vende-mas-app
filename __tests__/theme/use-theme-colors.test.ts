import { act, renderHook } from '@testing-library/react-native';
import { colorScheme } from 'nativewind';
import { palette } from '@/theme/palette';
import { hslColor } from '@/theme/theme-vars';
import {
  useAppColorScheme,
  useThemeColorWithAlpha,
  useThemeColors,
} from '@/theme/use-theme-colors';

describe('useThemeColors', () => {
  const setScheme = (scheme: 'light' | 'dark') =>
    act(async () => {
      colorScheme.set(scheme);
    });

  afterEach(async () => {
    await setScheme('light');
  });

  it('returns the light palette in light mode', async () => {
    await setScheme('light');
    const { result } = await renderHook(() => useThemeColors());

    expect(result.current.primary).toBe(hslColor(palette.light.primary));
    expect(result.current.background).toBe(hslColor(palette.light.background));
  });

  it('returns the dark palette in dark mode', async () => {
    await setScheme('dark');
    const { result } = await renderHook(() => useThemeColors());

    expect(result.current.primary).toBe(hslColor(palette.dark.primary));
    expect(result.current.card).toBe(hslColor(palette.dark.card));
  });

  it('re-renders when the scheme changes (no stale icon colors)', async () => {
    await setScheme('light');
    const { result } = await renderHook(() => ({
      scheme: useAppColorScheme(),
      foreground: useThemeColors().foreground,
      tint: useThemeColorWithAlpha('primary', 0.1),
    }));
    expect(result.current.scheme).toBe('light');

    await setScheme('dark');

    expect(result.current.scheme).toBe('dark');
    expect(result.current.foreground).toBe(hslColor(palette.dark.foreground));
    expect(result.current.tint).toBe(hslColor(palette.dark.primary, 0.1));
  });
});
