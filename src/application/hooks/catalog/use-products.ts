import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ProductEntity } from '@/core/entities/product.entity';
import type { ICatalogRepositoryPort } from '@/core/ports/catalog.repository.port';
import type { ProductFilter } from '@/core/types/catalog.types';
import { sqliteCatalogRepository } from '@/infrastructure/database/repositories/sqlite-catalog.repository';
import { catalogKeys } from './catalog.keys';

/** Active products of the local catalog (downloaded by the sync). */
export function useProducts(
  filter: ProductFilter = {},
  repository: ICatalogRepositoryPort = sqliteCatalogRepository,
) {
  const query = useQuery<ProductEntity[], Error>({
    queryKey: catalogKeys.products(filter),
    queryFn: () => repository.findProducts(filter),
    placeholderData: keepPreviousData,
  });

  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
