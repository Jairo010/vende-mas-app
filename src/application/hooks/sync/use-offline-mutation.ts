import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { syncCoordinator, type SyncCoordinator } from '@/application/sync/sync-coordinator';

export interface OfflineMutationOptions<TResult, TVariables> {
  /** Writes to the local database and queues the change (a repository call). */
  mutationFn: (variables: TVariables) => Promise<TResult>;
  /** Queries to refresh after the local write. */
  invalidates: (result: TResult, variables: TVariables) => QueryKey[];
  coordinator?: SyncCoordinator;
}

/**
 * Standard shape of every write in the app: local write + outbox (works offline),
 * refresh the affected queries, then a debounced sync attempt.
 */
export function useOfflineMutation<TResult, TVariables>({
  mutationFn,
  invalidates,
  coordinator = syncCoordinator,
}: OfflineMutationOptions<TResult, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TResult, Error, TVariables>({
    mutationFn: (variables) => mutationFn(variables),
    // Local writes do not fail for network reasons: never retry them blindly.
    retry: false,
    networkMode: 'always',
    onSuccess: async (result, variables) => {
      await Promise.all(
        invalidates(result, variables).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
      await coordinator.refreshCounters().catch(() => {});
      coordinator.scheduleSync(queryClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  });
}
