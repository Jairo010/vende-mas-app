import { useQuery } from '@tanstack/react-query';
import type { ICollectionRepositoryPort } from '@/core/ports/collection.repository.port';
import {
  DEFAULT_COLLECTIONS_SETTINGS,
  type CollectionsSettings,
} from '@/core/types/collection.types';
import { sqliteCollectionRepository } from '@/infrastructure/database/repositories/sqlite-collection.repository';
import { collectionsKeys } from './collections.keys';

/** Credit rules received from the server (block orders with overdue balance, grace days). */
export function useCollectionsSettings(
  repository: ICollectionRepositoryPort = sqliteCollectionRepository,
) {
  const query = useQuery<CollectionsSettings, Error>({
    queryKey: collectionsKeys.settings(),
    queryFn: () => repository.getSettings(),
  });

  return { settings: query.data ?? DEFAULT_COLLECTIONS_SETTINGS };
}
