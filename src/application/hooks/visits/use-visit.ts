import { useQuery } from '@tanstack/react-query';
import type { VisitEntity } from '@/core/entities/visit.entity';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { visitsKeys } from './visits.keys';

export function useVisit(
  id: string | undefined,
  repository: IVisitRepositoryPort = sqliteVisitRepository,
) {
  const query = useQuery<VisitEntity | null, Error>({
    queryKey: visitsKeys.detail(id ?? ''),
    queryFn: () => repository.findById(id as string),
    enabled: Boolean(id),
  });

  return {
    visit: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
