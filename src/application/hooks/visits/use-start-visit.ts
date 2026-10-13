import type { VisitEntity } from '@/core/entities/visit.entity';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { StartVisitInput } from '@/core/types/visit.types';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { customersKeys } from '../customers/customers.keys';
import { useOfflineMutation } from '../sync/use-offline-mutation';
import { visitsKeys } from './visits.keys';

export interface StartVisitVariables extends StartVisitInput {
  id: string;
}

/** Check-in (works offline). The first check-in may pin the store location. */
export function useStartVisit(repository: IVisitRepositoryPort = sqliteVisitRepository) {
  const mutation = useOfflineMutation<VisitEntity, StartVisitVariables>({
    mutationFn: ({ id, ...input }) => repository.start(id, input),
    invalidates: () => [visitsKeys.all, customersKeys.all],
  });

  return { startVisit: mutation.mutateAsync, isPending: mutation.isPending };
}
