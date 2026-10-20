import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ProductEntity } from '@/core/entities/product.entity';
import type { ICatalogRepositoryPort } from '@/core/ports/catalog.repository.port';
import { sqliteCatalogRepository } from '@/infrastructure/database/repositories/sqlite-catalog.repository';
import { catalogKeys } from './catalog.keys';

/** Current catalog data of the products in a cart (prices may change after a sync). */
export function useCartProducts(
  productIds: readonly string[],
  repository: ICatalogRepositoryPort = sqliteCatalogRepository,
) {
  const ids = [...productIds].sort();
  const query = useQuery<ProductEntity[], Error>({
    queryKey: catalogKeys.productsByIds(ids),
    queryFn: () => repository.findProductsByIds(ids),
    placeholderData: keepPreviousData,
  });

  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    /** The data matches the requested ids (not the previous cart shown as placeholder). */
    isReady: query.isSuccess && !query.isPlaceholderData,
  };
}
