import { useQuery } from '@tanstack/react-query';
import type { CustomerEntity } from '@/core/entities/customer.entity';
import type { ICustomerRepositoryPort } from '@/core/ports/customer.repository.port';
import { sqliteCustomerRepository } from '@/infrastructure/database/repositories/sqlite-customer.repository';
import { customersKeys } from './customers.keys';

export function useCustomer(
  id: string | undefined,
  repository: ICustomerRepositoryPort = sqliteCustomerRepository,
) {
  const query = useQuery<CustomerEntity | null, Error>({
    queryKey: customersKeys.detail(id ?? ''),
    queryFn: () => repository.findById(id as string),
    enabled: Boolean(id),
  });

  return {
    customer: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
