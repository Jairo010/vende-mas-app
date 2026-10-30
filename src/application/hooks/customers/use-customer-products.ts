import { useQuery } from '@tanstack/react-query';
import type { ICustomerProductRepositoryPort } from '@/core/ports/customer-product.repository.port';
import type { CustomerProduct } from '@/core/types/customer-product.types';
import { sqliteCustomerProductRepository } from '@/infrastructure/database/repositories/sqlite-customer-product.repository';
import { customersKeys } from './customers.keys';

/** What the customer usually buys (offline), most bought first. */
export function useCustomerProducts(
  customerId: string | undefined,
  repository: ICustomerProductRepositoryPort = sqliteCustomerProductRepository,
) {
  const query = useQuery<CustomerProduct[], Error>({
    queryKey: customersKeys.products(customerId ?? ''),
    queryFn: () => repository.findByCustomer(customerId ?? ''),
    enabled: Boolean(customerId),
  });
  return { customerProducts: query.data ?? [], isLoading: query.isLoading };
}
