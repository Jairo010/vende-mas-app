import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { CustomerEntity } from '@/core/entities/customer.entity';
import type { ICustomerRepositoryPort } from '@/core/ports/customer.repository.port';
import type { CustomerFilter } from '@/core/types/customer.types';
import { sqliteCustomerRepository } from '@/infrastructure/database/repositories/sqlite-customer.repository';
import { customersKeys } from './customers.keys';

/** Customers and prospects available offline (search by name or identification). */
export function useCustomers(
  filter: CustomerFilter = {},
  repository: ICustomerRepositoryPort = sqliteCustomerRepository,
) {
  const query = useQuery<CustomerEntity[], Error>({
    queryKey: customersKeys.list(filter),
    queryFn: () => repository.search(filter),
    placeholderData: keepPreviousData,
  });

  return {
    customers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
