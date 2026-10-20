import { useQuery } from '@tanstack/react-query';
import type { ReceivableEntity } from '@/core/entities/receivable.entity';
import type { ICollectionRepositoryPort } from '@/core/ports/collection.repository.port';
import { sqliteCollectionRepository } from '@/infrastructure/database/repositories/sqlite-collection.repository';
import { collectionsKeys } from './collections.keys';

export function useReceivable(
  id: string | undefined,
  repository: ICollectionRepositoryPort = sqliteCollectionRepository,
) {
  const query = useQuery<ReceivableEntity | null, Error>({
    queryKey: collectionsKeys.receivable(id ?? ''),
    queryFn: () => repository.findReceivableById(id as string),
    enabled: Boolean(id),
  });

  return { receivable: query.data ?? null, isLoading: query.isLoading };
}
