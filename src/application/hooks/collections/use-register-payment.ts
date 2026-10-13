import type { PaymentEntity } from '@/core/entities/payment.entity';
import type { ICollectionRepositoryPort } from '@/core/ports/collection.repository.port';
import type { RegisterPaymentInput } from '@/core/types/collection.types';
import { sqliteCollectionRepository } from '@/infrastructure/database/repositories/sqlite-collection.repository';
import { requireActor, useActor } from '../auth/use-actor';
import { useOfflineMutation } from '../sync/use-offline-mutation';
import { collectionsKeys } from './collections.keys';

/** Registers a payment offline: applied to the installments now, sent with the next sync. */
export function useRegisterPayment(
  repository: ICollectionRepositoryPort = sqliteCollectionRepository,
) {
  const actor = useActor();

  const mutation = useOfflineMutation<PaymentEntity, RegisterPaymentInput>({
    mutationFn: (input) => repository.registerPayment(input, requireActor(actor)),
    invalidates: () => [collectionsKeys.all],
  });

  return { registerPayment: mutation.mutateAsync, isPending: mutation.isPending };
}
