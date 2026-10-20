import { useQuery } from '@tanstack/react-query';
import type { ICatalogRepositoryPort } from '@/core/ports/catalog.repository.port';
import type { Category } from '@/core/types/catalog.types';
import { sqliteCatalogRepository } from '@/infrastructure/database/repositories/sqlite-catalog.repository';
import { catalogKeys } from './catalog.keys';

export function useCategories(repository: ICatalogRepositoryPort = sqliteCatalogRepository) {
  const query = useQuery<Category[], Error>({
    queryKey: catalogKeys.categories(),
    queryFn: () => repository.findCategories(),
  });

  return { categories: query.data ?? [], isLoading: query.isLoading };
}
