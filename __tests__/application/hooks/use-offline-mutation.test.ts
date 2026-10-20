import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOfflineMutation } from '@/application/hooks/sync/use-offline-mutation';
import type { SyncCoordinator } from '@/application/sync/sync-coordinator';

describe('useOfflineMutation', () => {
  let queryClient: QueryClient;
  let coordinator: jest.Mocked<Pick<SyncCoordinator, 'refreshCounters' | 'scheduleSync'>>;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    queryClient = new QueryClient();
    jest.spyOn(queryClient, 'invalidateQueries');
    coordinator = {
      refreshCounters: jest.fn().mockResolvedValue(undefined),
      scheduleSync: jest.fn(),
    };
  });

  it('writes locally, refreshes the affected queries and schedules a sync', async () => {
    const write = jest.fn().mockResolvedValue({ id: 'visit-1' });
    const { result } = await renderHook(
      () =>
        useOfflineMutation({
          mutationFn: write,
          invalidates: (visit: { id: string }) => [['visits'], ['visits', 'detail', visit.id]],
          coordinator: coordinator as unknown as SyncCoordinator,
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ customerId: 'customer-1' });
    });

    expect(write).toHaveBeenCalledWith({ customerId: 'customer-1' });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['visits'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['visits', 'detail', 'visit-1'],
    });
    expect(coordinator.refreshCounters).toHaveBeenCalled();
    expect(coordinator.scheduleSync).toHaveBeenCalledWith(queryClient);
  });

  it('does not schedule a sync when the local write fails (e.g. invalid transition)', async () => {
    const { result } = await renderHook(
      () =>
        useOfflineMutation({
          mutationFn: jest.fn().mockRejectedValue(new Error('invalid')),
          invalidates: () => [['visits']],
          coordinator: coordinator as unknown as SyncCoordinator,
        }),
      { wrapper },
    );

    await act(async () => {
      await expect(result.current.mutateAsync(undefined)).rejects.toThrow('invalid');
    });

    expect(coordinator.scheduleSync).not.toHaveBeenCalled();
  });
});
