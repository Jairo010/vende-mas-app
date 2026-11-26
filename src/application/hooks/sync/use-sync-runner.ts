import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { INetworkStatusPort } from '@/core/ports/sync.ports';
import { netInfoNetworkAdapter } from '@/infrastructure/network/netinfo-network.adapter';
import { syncCoordinator, type SyncCoordinator } from '@/application/sync/sync-coordinator';
import { useSyncStore } from '@/stores/sync.store';

/** Background safety net: sync every few minutes while the app is open. */
export const PERIODIC_SYNC_INTERVAL_MS = 5 * 60_000;
/** Coming back to the app right after a sync does not start another one. */
export const FOREGROUND_SYNC_MIN_GAP_MS = 60_000;

/**
 * Keeps the device in sync while a seller is signed in. Mount it once, in the
 * authenticated layout. Triggers: mount, reconnection, return to foreground and a timer.
 */
export function useSyncRunner(
  coordinator: SyncCoordinator = syncCoordinator,
  network: INetworkStatusPort = netInfoNetworkAdapter,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let lastRunAt = 0;
    const sync = () => {
      lastRunAt = Date.now();
      void coordinator.syncNow(queryClient).catch(() => {});
    };
    let wasOnline = useSyncStore.getState().isOnline;

    void coordinator.refreshCounters().catch(() => {});
    sync();

    const unsubscribeNetwork = network.subscribe((online) => {
      useSyncStore.getState().setOnline(online);
      if (online && !wasOnline) sync();
      wasOnline = online;
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      // Camera, maps or a phone call send the app to the background for a moment.
      if (state === 'active' && Date.now() - lastRunAt >= FOREGROUND_SYNC_MIN_GAP_MS) sync();
    });

    const interval = setInterval(sync, PERIODIC_SYNC_INTERVAL_MS);

    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
      clearInterval(interval);
      coordinator.cancelScheduled();
    };
  }, [coordinator, network, queryClient]);
}
