import { useShallow } from 'zustand/react/shallow';
import { useSyncStore } from '@/stores/sync.store';

export type SyncIndicator = 'offline' | 'syncing' | 'error' | 'pending' | 'synced';

/** What the sync pill / offline banner show. */
export function useSyncStatus() {
  const state = useSyncStore(
    useShallow((s) => ({
      phase: s.phase,
      isOnline: s.isOnline,
      pendingCount: s.pendingCount,
      rejectedCount: s.rejectedCount,
      lastSyncedAt: s.lastSyncedAt,
      lastError: s.lastError,
    })),
  );

  const indicator: SyncIndicator = !state.isOnline
    ? 'offline'
    : state.phase === 'syncing'
      ? 'syncing'
      : state.rejectedCount > 0 || (state.lastError && state.lastError !== 'OFFLINE')
        ? 'error'
        : state.pendingCount > 0
          ? 'pending'
          : 'synced';

  return { ...state, indicator };
}
