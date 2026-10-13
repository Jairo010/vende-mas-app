import type { CustomerEntity } from '@/core/entities/customer.entity';
import type { ICustomerRepositoryPort } from '@/core/ports/customer.repository.port';
import type { PromoteCustomerInput } from '@/core/types/customer.types';
import { sqliteCustomerRepository } from '@/infrastructure/database/repositories/sqlite-customer.repository';
import { useOfflineMutation } from '../sync/use-offline-mutation';
import { visitsKeys } from '../visits/visits.keys';
import { customersKeys } from './customers.keys';

export interface PromoteCustomerVariables extends PromoteCustomerInput {
  id: string;
}

/** PROSPECT → ACTIVE with billing data (works offline; exported to billing by the API). */
export function usePromoteCustomer(repository: ICustomerRepositoryPort = sqliteCustomerRepository) {
  const mutation = useOfflineMutation<CustomerEntity, PromoteCustomerVariables>({
    mutationFn: ({ id, ...input }) => repository.promote(id, input),
    // Visits embed the customer status (the visit flow unlocks "close sale").
    invalidates: () => [customersKeys.all, visitsKeys.all],
  });

  return { promoteCustomer: mutation.mutateAsync, isPending: mutation.isPending };
}
