import type { VisitEntity } from '@/core/entities/visit.entity';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { RescheduleVisitInput } from '@/core/types/visit.types';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { useOfflineMutation } from '../sync/use-offline-mutation';
import { visitsKeys } from './visits.keys';

export interface RescheduleVisitVariables extends RescheduleVisitInput {
  id: string;
}

export function useRescheduleVisit(repository: IVisitRepositoryPort = sqliteVisitRepository) {
  const mutation = useOfflineMutation<VisitEntity, RescheduleVisitVariables>({
    mutationFn: ({ id, ...input }) => repository.reschedule(id, input),
    invalidates: () => [visitsKeys.all],
  });

  return { rescheduleVisit: mutation.mutateAsync, isPending: mutation.isPending };
}
