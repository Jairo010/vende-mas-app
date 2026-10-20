import { useQuery } from '@tanstack/react-query';
import type { VisitEntity } from '@/core/entities/visit.entity';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { useAuthStore } from '@/stores/auth.store';
import { visitsKeys } from './visits.keys';

/** The current user's visit in progress (for the "Visita en curso" banner). */
export function useVisitInProgress(repository: IVisitRepositoryPort = sqliteVisitRepository) {
  const userId = useAuthStore((state) => state.user?.id);

  const query = useQuery<VisitEntity | null, Error>({
    queryKey: visitsKeys.inProgress(userId ?? ''),
    queryFn: () => repository.findInProgress(userId as string),
    enabled: Boolean(userId),
  });

  return { visit: query.data ?? null, isLoading: query.isLoading };
}
