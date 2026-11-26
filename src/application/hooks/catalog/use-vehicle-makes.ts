import { useQuery } from '@tanstack/react-query';
import type { ICatalogRepositoryPort } from '@/core/ports/catalog.repository.port';
import type { ProductFamily, VehicleMakeOption } from '@/core/types/catalog.types';
import { sqliteCatalogRepository } from '@/infrastructure/database/repositories/sqlite-catalog.repository';
import { catalogKeys } from './catalog.keys';

/** Makes and models the catalog fits (inside a family when one is chosen). */
export function useVehicleMakes(
  family?: ProductFamily,
  enabled = true,
  repository: ICatalogRepositoryPort = sqliteCatalogRepository,
) {
  const query = useQuery<VehicleMakeOption[], Error>({
    queryKey: catalogKeys.vehicles(family),
    queryFn: () => repository.findVehicleMakes(family),
    enabled,
  });

  return { makes: query.data ?? [], isLoading: query.isLoading };
}
