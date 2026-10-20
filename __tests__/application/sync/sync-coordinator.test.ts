import { QueryClient } from '@tanstack/react-query';
import { SyncCoordinator } from '@/application/sync/sync-coordinator';
import type { SyncEngine } from '@/application/sync/sync-engine';
import type { IOutboxPort } from '@/core/ports/sync.ports';
import type { SyncRunSummary } from '@/core/types/sync.types';
import { useSyncStore } from '@/stores/sync.store';

describe('SyncCoordinator', () => {
  let engine: jest.Mocked<Pick<SyncEngine, 'run'>>;
  let outbox: jest.Mocked<Pick<IOutboxPort, 'countPending' | 'listRejected'>>;
  let queryClient: QueryClient;
  let coordinator: SyncCoordinator;

  const summary = (overrides: Partial<SyncRunSummary> = {}): SyncRunSummary => ({
    pushed: 1,
    rejected: 0,
    pending: 0,
    pulled: true,
    error: null,
    ...overrides,
  });

  beforeEach(() => {
    useSyncStore.getState().reset();
    engine = { run: jest.fn().mockResolvedValue(summary()) };
    outbox = {
      countPending: jest.fn().mockResolvedValue(0),
      listRejected: jest.fn().mockResolvedValue([]),
    };
    queryClient = new QueryClient();
    jest.spyOn(queryClient, 'invalidateQueries');
    coordinator = new SyncCoordinator({
      engine: engine as unknown as SyncEngine,
      outbox: outbox as unknown as IOutboxPort,
      getLastSyncedAt: async () => '2026-10-14T15:00:00.000Z',
    });
  });

  afterEach(() => {
    coordinator.cancelScheduled();
    jest.useRealTimers();
  });

  it('publishes progress and refreshes local queries after a run', async () => {
    const run = coordinator.syncNow(queryClient);
    expect(useSyncStore.getState().phase).toBe('syncing');
    await run;

    const state = useSyncStore.getState();
    expect(state.phase).toBe('idle');
    expect(state.lastSyncedAt).toBe('2026-10-14T15:00:00.000Z');
    expect(state.lastError).toBeNull();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['visits'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['orders'] });
  });

  it('marks the device offline when the run could not reach the server', async () => {
    engine.run.mockResolvedValue(summary({ error: 'OFFLINE', pulled: false }));
    outbox.countPending.mockResolvedValue(3);

    await coordinator.syncNow(queryClient);

    expect(useSyncStore.getState()).toMatchObject({
      isOnline: false,
      pendingCount: 3,
      lastError: 'OFFLINE',
    });
  });

  it('groups quick local changes into a single debounced sync', async () => {
    jest.useFakeTimers();

    coordinator.scheduleSync(queryClient, 1000);
    coordinator.scheduleSync(queryClient, 1000);
    coordinator.scheduleSync(queryClient, 1000);
    await jest.advanceTimersByTimeAsync(1000);

    expect(engine.run).toHaveBeenCalledTimes(1);
  });
});
