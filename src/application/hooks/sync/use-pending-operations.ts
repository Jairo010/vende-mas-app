import { useQuery } from '@tanstack/react-query';
import type { IOutboxPort } from '@/core/ports/sync.ports';
import type { OutboxOperation } from '@/core/types/sync.types';
import { sqliteOutboxRepository } from '@/infrastructure/database/repositories/sqlite-outbox.repository';
import { syncKeys } from '@/application/sync/sync.keys';

const QUEUE_PREVIEW_LIMIT = 200;

/** Changes waiting to be sent, in the order they will be pushed. */
export function usePendingOperations(outbox: IOutboxPort = sqliteOutboxRepository) {
  const query = useQuery<OutboxOperation[], Error>({
    queryKey: syncKeys.pending(),
    queryFn: () => outbox.listPending(QUEUE_PREVIEW_LIMIT),
    networkMode: 'always',
  });

  return { operations: query.data ?? [], isLoading: query.isLoading };
}
