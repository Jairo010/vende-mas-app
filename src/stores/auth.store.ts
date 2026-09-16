import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';
import type { AuthUser } from '@/core/types/auth.types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearSession: () => set({ user: null, isAuthenticated: false }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
