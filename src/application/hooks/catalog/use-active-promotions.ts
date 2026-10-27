import { useQuery } from '@tanstack/react-query';
import { useCompanyModules } from '../auth/use-company-modules';
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

  const { has } = useCompanyModules();
  // Without the module the server prices orders without promotions: do not show them.
  return { promotions: has('PROMOTIONS') ? (query.data ?? []) : [], isLoading: query.isLoading };
}
