import { create } from 'zustand';

export type SyncPhase = 'idle' | 'syncing';

/** UI state of the offline sync (not persisted: the source of truth is the local database). */
interface SyncState {
  phase: SyncPhase;
  isOnline: boolean;
  pendingCount: number;
  rejectedCount: number;
  lastSyncedAt: string | null;
  /** Reason the last run stopped early (OFFLINE, SERVER_ERROR, ...), or null. */
  lastError: string | null;
  setPhase: (phase: SyncPhase) => void;
  setOnline: (isOnline: boolean) => void;
  setCounters: (counters: { pendingCount: number; rejectedCount: number }) => void;
  finishRun: (result: { lastSyncedAt: string | null; lastError: string | null }) => void;
  reset: () => void;
}

const initialState = {
  phase: 'idle' as SyncPhase,
  isOnline: true,
  pendingCount: 0,
  rejectedCount: 0,
  lastSyncedAt: null,
  lastError: null,
};

export const useSyncStore = create<SyncState>()((set) => ({
  ...initialState,
  setPhase: (phase) => set({ phase }),
  setOnline: (isOnline) => set({ isOnline }),
  setCounters: (counters) => set(counters),
  finishRun: ({ lastSyncedAt, lastError }) => set({ phase: 'idle', lastSyncedAt, lastError }),
  reset: () => set(initialState),
}));
