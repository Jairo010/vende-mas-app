import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncCoordinator, type SyncCoordinator } from '@/application/sync/sync-coordinator';
import type { SyncRunSummary } from '@/core/types/sync.types';
import { useSyncStore } from '@/stores/sync.store';

/** Manual sync (pull-to-refresh, "Sincronizar ahora"). */
export function useSyncNow(coordinator: SyncCoordinator = syncCoordinator) {
  const queryClient = useQueryClient();
  const isSyncing = useSyncStore((state) => state.phase === 'syncing');

  const syncNow = useCallback(
    (): Promise<SyncRunSummary | null> => coordinator.syncNow(queryClient),
    [coordinator, queryClient],
  );

  return { syncNow, isSyncing };
}
