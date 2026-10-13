import { useQuery } from '@tanstack/react-query';
import type { PaymentEntity } from '@/core/entities/payment.entity';
import type { ICollectionRepositoryPort } from '@/core/ports/collection.repository.port';
import { sqliteCollectionRepository } from '@/infrastructure/database/repositories/sqlite-collection.repository';
import { collectionsKeys } from './collections.keys';

export function usePayment(
  id: string | undefined,
  repository: ICollectionRepositoryPort = sqliteCollectionRepository,
) {
  const query = useQuery<PaymentEntity | null, Error>({
    queryKey: collectionsKeys.payment(id ?? ''),
    queryFn: () => repository.findPaymentById(id as string),
    enabled: Boolean(id),
  });

  return { payment: query.data ?? null, isLoading: query.isLoading };
}
