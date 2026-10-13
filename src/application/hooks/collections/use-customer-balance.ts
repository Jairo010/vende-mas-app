import { useQuery } from '@tanstack/react-query';
import type { ICollectionRepositoryPort } from '@/core/ports/collection.repository.port';
import type { CustomerBalance } from '@/core/types/collection.types';
import { sqliteCollectionRepository } from '@/infrastructure/database/repositories/sqlite-collection.repository';
import { collectionsKeys } from './collections.keys';

const EMPTY_BALANCE: CustomerBalance = { balance: 0, overdue: 0, openReceivables: 0 };

/** What a customer owes and how much of it is overdue (credit rule grace days included). */
export function useCustomerBalance(
  customerId: string | undefined,
  repository: ICollectionRepositoryPort = sqliteCollectionRepository,
) {
  const query = useQuery<CustomerBalance, Error>({
    queryKey: collectionsKeys.balance(customerId ?? ''),
    queryFn: () => repository.getCustomerBalance(customerId as string),
    enabled: Boolean(customerId),
  });

  return { balance: query.data ?? EMPTY_BALANCE, isLoading: query.isLoading };
}
