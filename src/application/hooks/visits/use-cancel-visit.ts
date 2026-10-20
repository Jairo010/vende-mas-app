import type { VisitEntity } from '@/core/entities/visit.entity';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { CancelVisitInput } from '@/core/types/visit.types';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { useOfflineMutation } from '../sync/use-offline-mutation';
import { visitsKeys } from './visits.keys';

export interface CancelVisitVariables extends CancelVisitInput {
  id: string;
}

export function useCancelVisit(repository: IVisitRepositoryPort = sqliteVisitRepository) {
  const mutation = useOfflineMutation<VisitEntity, CancelVisitVariables>({
    mutationFn: ({ id, ...input }) => repository.cancel(id, input),
    invalidates: () => [visitsKeys.all],
  });

  return { cancelVisit: mutation.mutateAsync, isPending: mutation.isPending };
}
