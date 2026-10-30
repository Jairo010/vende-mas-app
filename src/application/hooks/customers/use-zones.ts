import { useQuery } from '@tanstack/react-query';
import type { IZoneRepositoryPort } from '@/core/ports/zone.repository.port';
import type { Zone } from '@/core/types/customer.types';
import { sqliteZoneRepository } from '@/infrastructure/database/repositories/sqlite-zone.repository';
import { customersKeys } from './customers.keys';

/** Active zones of the company (offline): to place a new prospect and show a customer's zone. */
export function useZones(repository: IZoneRepositoryPort = sqliteZoneRepository) {
  const query = useQuery<Zone[], Error>({
    queryKey: customersKeys.zones(),
    queryFn: () => repository.findAll(),
  });
  return { zones: query.data ?? [], isLoading: query.isLoading };
}
