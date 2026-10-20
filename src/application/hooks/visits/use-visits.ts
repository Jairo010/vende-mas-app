import { useQuery } from '@tanstack/react-query';
import type { VisitEntity } from '@/core/entities/visit.entity';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { VisitFilter } from '@/core/types/visit.types';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { visitsKeys } from './visits.keys';

/** Visits scheduled in a range (agenda, calendar), read from the device database. */
export function useVisits(
  filter: VisitFilter,
  repository: IVisitRepositoryPort = sqliteVisitRepository,
) {
  const query = useQuery<VisitEntity[], Error>({
    queryKey: visitsKeys.list(filter),
    queryFn: () => repository.findByRange(filter),
  });

  return {
    visits: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
