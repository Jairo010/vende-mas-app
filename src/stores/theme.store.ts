import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { colorScheme } from 'nativewind';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Stores only the user PREFERENCE. The effective scheme is read reactively with
 * `useAppColorScheme()` (NativeWind), which also follows the OS when the mode is `system`.
 */
interface ThemeState {
  mode: ThemeMode;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      isHydrated: false,
      setMode: (mode) => {
        colorScheme.set(mode);
        set({ mode });
      },
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        colorScheme.set(state?.mode ?? 'system');
        state?.setHydrated(true);
      },
    },
  ),
);
