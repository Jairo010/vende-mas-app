import { colorScheme } from 'nativewind';
import { useThemeStore } from '@/stores/theme.store';

describe('useThemeStore', () => {
  let setSpy: jest.SpyInstance;

  beforeEach(() => {
    setSpy = jest.spyOn(colorScheme, 'set');
  });

  afterEach(() => {
    setSpy.mockRestore();
    useThemeStore.getState().setMode('system');
  });

  it('defaults to following the system', () => {
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it.each(['light', 'dark', 'system'] as const)(
    'stores "%s" and applies it through NativeWind',
    (mode) => {
      useThemeStore.getState().setMode(mode);

      expect(useThemeStore.getState().mode).toBe(mode);
      expect(setSpy).toHaveBeenCalledWith(mode);
    },
  );

  it('persists only the preference', () => {
    useThemeStore.getState().setMode('dark');

    const persisted = useThemeStore.persist.getOptions().partialize?.(useThemeStore.getState());
    expect(persisted).toEqual({ mode: 'dark' });
  });
});
