import { useQuery } from '@tanstack/react-query';
import type { PaymentEntity } from '@/core/entities/payment.entity';
import type { ICollectionRepositoryPort } from '@/core/ports/collection.repository.port';
import type { PaymentFilter } from '@/core/types/collection.types';
import { sqliteCollectionRepository } from '@/infrastructure/database/repositories/sqlite-collection.repository';
import { collectionsKeys } from './collections.keys';

/** Payments collected by the seller (newest first). */
export function usePayments(
  filter: PaymentFilter,
  enabled = true,
  repository: ICollectionRepositoryPort = sqliteCollectionRepository,
) {
  const query = useQuery<PaymentEntity[], Error>({
    queryKey: collectionsKeys.payments(filter),
    queryFn: () => repository.findPayments(filter),
    enabled,
  });

  return { payments: query.data ?? [], isLoading: query.isLoading };
}
