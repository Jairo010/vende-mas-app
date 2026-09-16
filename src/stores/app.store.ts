import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';

interface AppState {
  hasCompletedOnboarding: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      setOnboardingCompleted: (completed) => set({ hasCompletedOnboarding: completed }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
    },
  ),
);
