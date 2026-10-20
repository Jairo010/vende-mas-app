import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CustomerEntity } from '@/core/entities/customer.entity';
import type { ICustomerLookupPort } from '@/core/ports/customer-lookup.port';
import type { ICustomerRepositoryPort } from '@/core/ports/customer.repository.port';
import { customerApiService } from '@/infrastructure/api/services/customer-api.service';
import { sqliteCustomerRepository } from '@/infrastructure/database/repositories/sqlite-customer.repository';
import { customersKeys } from './customers.keys';

export interface CustomerLookupOutcome {
  customer: CustomerEntity;
  source: 'DEVICE' | 'LOCAL' | 'BILLING';
}

/**
 * Finds a customer by RUC / cédula / passport: on the device first, then online in the API
 * (which imports it from the billing system). A customer found online is saved locally so
 * visits and orders can be created for it offline.
 */
export function useCustomerLookup(
  lookup: ICustomerLookupPort = customerApiService,
  repository: ICustomerRepositoryPort = sqliteCustomerRepository,
) {
  const queryClient = useQueryClient();

  const mutation = useMutation<CustomerLookupOutcome, Error, string>({
    mutationFn: async (identification) => {
      const local = await repository.findByIdentification(identification);
      if (local) return { customer: local, source: 'DEVICE' };

      const remote = await lookup.lookupByIdentification(identification);
      const saved = await repository.saveFromServer(remote.customer);
      return { customer: saved, source: remote.source };
    },
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customersKeys.all });
    },
  });

  return {
    lookupCustomer: mutation.mutateAsync,
    isPending: mutation.isPending,
    reset: mutation.reset,
  };
}
