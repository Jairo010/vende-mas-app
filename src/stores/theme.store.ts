import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appearance } from 'react-native';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  setHydrated: (hydrated: boolean) => void;
  getEffectiveScheme: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isHydrated: false,
      setMode: (mode) => {
        set({ mode });
        if (mode === 'system') {
          Appearance.setColorScheme('unspecified');
        } else {
          Appearance.setColorScheme(mode);
        }
      },
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      getEffectiveScheme: () => {
        const { mode } = get();
        if (mode === 'system') {
          const systemScheme = Appearance.getColorScheme();
          return systemScheme === 'dark' ? 'dark' : 'light';
        }
        return mode;
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (state?.mode && state.mode !== 'system') {
          Appearance.setColorScheme(state.mode);
        }
      },
    },
  ),
);
