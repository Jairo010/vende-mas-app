import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ICatalogRepositoryPort } from '@/core/ports/catalog.repository.port';
import type { ProductFacets, ProductFilter } from '@/core/types/catalog.types';
import { sqliteCatalogRepository } from '@/infrastructure/database/repositories/sqlite-catalog.repository';
import { catalogKeys } from './catalog.keys';

const NO_FACETS: ProductFacets = {
  total: 0,
  families: [],
  positions: [],
  materials: [],
  filterTypes: [],
  viscosities: [],
  oilTypes: [],
  presentations: [],
  brands: [],
};

/** What each filter of the sale catalog can still take, with how many products it leaves. */
export function useProductFacets(
  filter: ProductFilter = {},
  repository: ICatalogRepositoryPort = sqliteCatalogRepository,
) {
  const query = useQuery<ProductFacets, Error>({
    queryKey: catalogKeys.facets(filter),
    queryFn: () => repository.findFacets(filter),
    placeholderData: keepPreviousData,
  });

  return { facets: query.data ?? NO_FACETS, isLoading: query.isLoading };
}
