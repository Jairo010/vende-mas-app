import { useQuery } from '@tanstack/react-query';
import type { ICatalogRepositoryPort } from '@/core/ports/catalog.repository.port';
import type { Promotion } from '@/core/types/catalog.types';
import { sqliteCatalogRepository } from '@/infrastructure/database/repositories/sqlite-catalog.repository';
import { catalogKeys } from './catalog.keys';

/** Promotions valid now (downloaded by the sync), to price the cart like the server. */
export function useActivePromotions(repository: ICatalogRepositoryPort = sqliteCatalogRepository) {
  const query = useQuery<Promotion[], Error>({
    queryKey: catalogKeys.activePromotions(),
    queryFn: () => repository.findActivePromotions(),
  });

  return { promotions: query.data ?? [], isLoading: query.isLoading };
}
