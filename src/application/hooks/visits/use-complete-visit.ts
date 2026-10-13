import type { VisitEntity } from '@/core/entities/visit.entity';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { CompleteVisitInput } from '@/core/types/visit.types';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { customersKeys } from '../customers/customers.keys';
import { useOfflineMutation } from '../sync/use-offline-mutation';
import { visitsKeys } from './visits.keys';

export interface CompleteVisitVariables extends CompleteVisitInput {
  id: string;
}

/** Check-out with the outcome (works offline). A store photo replaces the customer's one. */
export function useCompleteVisit(repository: IVisitRepositoryPort = sqliteVisitRepository) {
  const mutation = useOfflineMutation<VisitEntity, CompleteVisitVariables>({
    mutationFn: ({ id, ...input }) => repository.complete(id, input),
    invalidates: () => [visitsKeys.all, customersKeys.all],
  });

  return { completeVisit: mutation.mutateAsync, isPending: mutation.isPending };
}
