import type { QueryClient } from '@tanstack/react-query';
import type { IOutboxPort } from '@/core/ports/sync.ports';
import type { SyncRunSummary } from '@/core/types/sync.types';
import { sqliteOutboxRepository } from '@/infrastructure/database/repositories/sqlite-outbox.repository';
import { sqliteSyncStoreRepository } from '@/infrastructure/database/repositories/sqlite-sync-store.repository';
import { useSyncStore } from '@/stores/sync.store';
import type { SyncEngine } from './sync-engine';
import { syncEngine } from './sync-engine.instance';
import { LOCAL_DATA_QUERY_ROOTS } from './sync.keys';

/** Delay that groups several quick local changes into a single push. */
export const LOCAL_CHANGE_SYNC_DELAY_MS = 1_500;

export interface SyncCoordinatorDependencies {
  engine: SyncEngine;
  outbox: IOutboxPort;
  getLastSyncedAt: () => Promise<string | null>;
}

/**
 * Glue between the engine and the UI: runs it, publishes progress to the sync store and
 * refreshes React Query after server changes land in SQLite.
 */
export class SyncCoordinator {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly deps: SyncCoordinatorDependencies) {}

  public async syncNow(queryClient: QueryClient): Promise<SyncRunSummary | null> {
    this.cancelScheduled();
    const store = useSyncStore.getState();
    store.setPhase('syncing');
    let summary: SyncRunSummary | null = null;
    try {
      summary = await this.deps.engine.run();
      if (summary.error === 'OFFLINE') store.setOnline(false);
      return summary;
    } finally {
      await this.refreshCounters();
      useSyncStore.getState().finishRun({
        lastSyncedAt: await this.deps.getLastSyncedAt(),
        lastError: summary?.error ?? (summary ? null : 'UNKNOWN'),
      });
      await Promise.all(
        LOCAL_DATA_QUERY_ROOTS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    }
  }

  /** Debounced sync after a local change (offline it simply waits for the next trigger). */
  public scheduleSync(queryClient: QueryClient, delayMs = LOCAL_CHANGE_SYNC_DELAY_MS): void {
    this.cancelScheduled();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.syncNow(queryClient).catch(() => {});
    }, delayMs);
  }

  public cancelScheduled(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  public async refreshCounters(): Promise<void> {
    const [pendingCount, rejected] = await Promise.all([
      this.deps.outbox.countPending(),
      this.deps.outbox.listRejected(),
    ]);
    useSyncStore.getState().setCounters({ pendingCount, rejectedCount: rejected.length });
  }
}

export const syncCoordinator = new SyncCoordinator({
  engine: syncEngine,
  outbox: sqliteOutboxRepository,
  getLastSyncedAt: () => sqliteSyncStoreRepository.getLastSyncedAt(),
});
