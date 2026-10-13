import type { OrderEntity } from '@/core/entities/order.entity';
import type { IOrderRepositoryPort } from '@/core/ports/order.repository.port';
import type { CreateOrderInput } from '@/core/types/order.types';
import { sqliteOrderRepository } from '@/infrastructure/database/repositories/sqlite-order.repository';
import { requireActor, useActor } from '../auth/use-actor';
import { useOfflineMutation } from '../sync/use-offline-mutation';
import { visitsKeys } from '../visits/visits.keys';
import { ordersKeys } from './orders.keys';

/** Saves the order on the device and queues it; the server assigns the official number. */
export function useCreateOrder(repository: IOrderRepositoryPort = sqliteOrderRepository) {
  const actor = useActor();

  const mutation = useOfflineMutation<OrderEntity, CreateOrderInput>({
    mutationFn: (input) => repository.create(input, requireActor(actor)),
    invalidates: (_order, input) =>
      input.visitId ? [ordersKeys.all, visitsKeys.all] : [ordersKeys.all],
  });

  return { createOrder: mutation.mutateAsync, isPending: mutation.isPending };
}
