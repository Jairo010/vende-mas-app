import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RoutePlan } from '@/core/types/route.types';
import type { DateKey } from '@/shared/utils/date';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';

/** The route of the day, for whom it was computed. */
export interface SavedRoutePlan {
  userId: string;
  date: DateKey;
  plan: RoutePlan;
}

interface RoutePlanState {
  saved: SavedRoutePlan | null;
  save: (saved: SavedRoutePlan) => void;
  clearAll: () => void;
}

/**
 * Persisted: reopening the map (or the app) the same day reuses the route and only trims it
 * as visits are done, instead of asking the API (and Google) again.
 */
export const useRoutePlanStore = create<RoutePlanState>()(
  persist(
    (set) => ({
      saved: null,
      save: (saved) => set({ saved }),
      clearAll: () => set({ saved: null }),
    }),
    {
      name: 'route-plan',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({ saved: state.saved }),
    },
  ),
);
