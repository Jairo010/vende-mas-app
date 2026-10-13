import { act, render, screen } from '@testing-library/react-native';
import { OfflineBanner } from '@/presentation/components/feedback/offline-banner';
import { SyncStatusPill } from '@/presentation/components/feedback/sync-status-pill';
import { useSyncStore } from '@/stores/sync.store';
import { es } from '@/shared/i18n/es';

describe('sync feedback components', () => {
  beforeEach(async () => {
    await act(async () => useSyncStore.getState().reset());
  });

  it('shows the offline banner only without connection', async () => {
    await render(<OfflineBanner />);
    expect(screen.queryByTestId('offline-banner')).toBeNull();

    await act(async () => useSyncStore.getState().setOnline(false));

    expect(screen.getByText(es.sync.offlineBanner)).toBeTruthy();
  });

  it.each([
    [{ isOnline: false }, es.sync.indicator.offline],
    [{ phase: 'syncing' as const }, es.sync.indicator.syncing],
    [{ rejectedCount: 1 }, es.sync.indicator.error],
    [{ pendingCount: 3 }, `3 ${es.sync.indicator.pending.toLowerCase()}`],
    [{}, es.sync.indicator.synced],
  ])('sync pill for %j says "%s"', async (state, label) => {
    await act(async () => useSyncStore.setState(state));

    await render(<SyncStatusPill />);

    expect(screen.getByText(label)).toBeTruthy();
  });
});
