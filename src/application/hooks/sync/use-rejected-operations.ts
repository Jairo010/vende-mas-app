import { useQuery } from '@tanstack/react-query';
import type { IOutboxPort } from '@/core/ports/sync.ports';
import type { OutboxOperation } from '@/core/types/sync.types';
import { sqliteOutboxRepository } from '@/infrastructure/database/repositories/sqlite-outbox.repository';
import { syncKeys } from '@/application/sync/sync.keys';
import { useOfflineMutation } from './use-offline-mutation';

/** Operations the server refused, with the reason, so the seller can fix or dismiss them. */
export function useRejectedOperations(outbox: IOutboxPort = sqliteOutboxRepository) {
  const query = useQuery<OutboxOperation[], Error>({
    queryKey: syncKeys.rejected(),
    queryFn: () => outbox.listRejected(),
    networkMode: 'always',
  });

  const discard = useOfflineMutation<void, number>({
    mutationFn: (seq) => outbox.discard(seq),
    invalidates: () => [syncKeys.all, ['visits'], ['customers'], ['orders']],
  });

  const requeue = useOfflineMutation<void, number>({
    mutationFn: (seq) => outbox.requeue(seq),
    invalidates: () => [syncKeys.all, ['visits'], ['customers'], ['orders']],
  });

  return {
    operations: query.data ?? [],
    isLoading: query.isLoading,
    discard: discard.mutateAsync,
    isDiscarding: discard.isPending,
    /** Sends a rejected operation again once its cause was fixed. */
    requeue: requeue.mutateAsync,
    isRequeueing: requeue.isPending,
  };
}
