import { useQuery } from '@tanstack/react-query';
import type { IRouteDayRepositoryPort } from '@/core/ports/route-day.repository.port';
import type { RouteDay } from '@/core/types/route.types';
import { sqliteRouteDayRepository } from '@/infrastructure/database/repositories/sqlite-route-day.repository';
import { visitsKeys } from '../visits/visits.keys';

/** The seller's weekly route (offline): which days a visit can be moved to. */
export function useRouteDays(repository: IRouteDayRepositoryPort = sqliteRouteDayRepository) {
  const query = useQuery<RouteDay[], Error>({
    queryKey: visitsKeys.routeDays(),
    queryFn: () => repository.findAll(),
  });
  return { routeDays: query.data ?? [] };
}
