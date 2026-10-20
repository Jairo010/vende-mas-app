import { useQuery } from '@tanstack/react-query';
import type { ReceivableEntity } from '@/core/entities/receivable.entity';
import type { ICollectionRepositoryPort } from '@/core/ports/collection.repository.port';
import type { ReceivableFilter } from '@/core/types/collection.types';
import { sqliteCollectionRepository } from '@/infrastructure/database/repositories/sqlite-collection.repository';
import { collectionsKeys } from './collections.keys';

/** Receivables on the device, oldest first (what a customer owes). */
export function useReceivables(
  filter: ReceivableFilter,
  enabled = true,
  repository: ICollectionRepositoryPort = sqliteCollectionRepository,
) {
  const query = useQuery<ReceivableEntity[], Error>({
    queryKey: collectionsKeys.receivables(filter),
    queryFn: () => repository.findReceivables(filter),
    enabled,
  });

  return { receivables: query.data ?? [], isLoading: query.isLoading };
}
