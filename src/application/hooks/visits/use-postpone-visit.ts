import type { VisitEntity } from '@/core/entities/visit.entity';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { PostponeVisitInput } from '@/core/types/visit.types';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { useOfflineMutation } from '../sync/use-offline-mutation';
import { visitsKeys } from './visits.keys';

export interface PostponeVisitVariables extends PostponeVisitInput {
  id: string;
}

export function usePostponeVisit(repository: IVisitRepositoryPort = sqliteVisitRepository) {
  const mutation = useOfflineMutation<VisitEntity, PostponeVisitVariables>({
    mutationFn: ({ id, ...input }) => repository.postpone(id, input),
    invalidates: () => [visitsKeys.all],
  });

  return { postponeVisit: mutation.mutateAsync, isPending: mutation.isPending };
}
