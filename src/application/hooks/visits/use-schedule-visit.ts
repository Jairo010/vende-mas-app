import type { VisitEntity } from '@/core/entities/visit.entity';
import type { ICustomerRepositoryPort } from '@/core/ports/customer.repository.port';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { CreateCustomerInput } from '@/core/types/customer.types';
import type { ScheduleVisitInput } from '@/core/types/visit.types';
import { sqliteCustomerRepository } from '@/infrastructure/database/repositories/sqlite-customer.repository';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { requireActor, useActor } from '../auth/use-actor';
import { customersKeys } from '../customers/customers.keys';
import { useOfflineMutation } from '../sync/use-offline-mutation';
import { visitsKeys } from './visits.keys';

export type ScheduleVisitVariables =
  | { visit: ScheduleVisitInput; prospect?: undefined }
  /** New prospect created on the spot (opportunity visits): it becomes the visit customer. */
  | { visit: Omit<ScheduleVisitInput, 'customerId'>; prospect: CreateCustomerInput };

/** Schedules a visit offline, creating the prospect first when the wizard asked for one. */
export function useScheduleVisit(
  visitRepository: IVisitRepositoryPort = sqliteVisitRepository,
  customerRepository: ICustomerRepositoryPort = sqliteCustomerRepository,
) {
  const actor = useActor();

  const mutation = useOfflineMutation<VisitEntity, ScheduleVisitVariables>({
    mutationFn: async (variables) => {
      const currentActor = requireActor(actor);
      if (variables.prospect) {
        const prospect = await customerRepository.create(
          { ...variables.prospect, status: 'PROSPECT' },
          currentActor,
        );
        return visitRepository.schedule(
          { ...variables.visit, customerId: prospect.id },
          currentActor,
        );
      }
      return visitRepository.schedule(variables.visit, currentActor);
    },
    invalidates: (_visit, variables) =>
      variables.prospect ? [visitsKeys.all, customersKeys.all] : [visitsKeys.all],
  });

  return {
    scheduleVisit: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
