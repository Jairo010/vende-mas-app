import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { VisitFailureReason, VisitOutcome } from '@/core/types/visit.types';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';

/** What the seller filled in during a visit, before the check-out saves it. */
export interface VisitDraft {
  notes: string;
  outcome: VisitOutcome | null;
  failureReason: VisitFailureReason | null;
  /** Durable local URI of the store photo (already copied out of the camera cache). */
  photoUri: string | null;
}

export const EMPTY_VISIT_DRAFT: VisitDraft = {
  notes: '',
  outcome: null,
  failureReason: null,
  photoUri: null,
};

interface VisitDraftState {
  drafts: Record<string, VisitDraft>;
  /**
   * Visit just finished whose next visit is not scheduled yet (app ADR 0015): the seller cannot
   * leave it, not even by closing the app.
   */
  pendingFollowUpId: string | null;
  updateDraft: (visitId: string, patch: Partial<VisitDraft>) => void;
  clearDraft: (visitId: string) => void;
  requireFollowUp: (visitId: string) => void;
  clearFollowUp: () => void;
  clearAll: () => void;
}

/**
 * Persisted per visit: a call, the camera or the OS killing the app in the middle of a
 * visit must not lose the notes or the photo.
 */
export const useVisitDraftStore = create<VisitDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      pendingFollowUpId: null,
      updateDraft: (visitId, patch) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [visitId]: { ...(state.drafts[visitId] ?? EMPTY_VISIT_DRAFT), ...patch },
          },
        })),
      clearDraft: (visitId) =>
        set((state) => {
          if (!(visitId in state.drafts)) return state;
          const { [visitId]: _removed, ...rest } = state.drafts;
          return { drafts: rest };
        }),
      requireFollowUp: (visitId) => set({ pendingFollowUpId: visitId }),
      clearFollowUp: () => set({ pendingFollowUpId: null }),
      clearAll: () => set({ drafts: {}, pendingFollowUpId: null }),
    }),
    {
      name: 'visit-drafts',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({
        drafts: state.drafts,
        pendingFollowUpId: state.pendingFollowUpId,
      }),
    },
  ),
);
