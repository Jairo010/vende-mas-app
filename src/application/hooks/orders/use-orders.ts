import { useQuery } from '@tanstack/react-query';
import type { OrderEntity } from '@/core/entities/order.entity';
import type { IOrderRepositoryPort } from '@/core/ports/order.repository.port';
import type { OrderFilter } from '@/core/types/order.types';
import { sqliteOrderRepository } from '@/infrastructure/database/repositories/sqlite-order.repository';
import { ordersKeys } from './orders.keys';

/** Orders on the device: synced ones and those still waiting for an official number. */
export function useOrders(
  filter: OrderFilter = {},
  repository: IOrderRepositoryPort = sqliteOrderRepository,
) {
  const query = useQuery<OrderEntity[], Error>({
    queryKey: ordersKeys.list(filter),
    queryFn: () => repository.findAll(filter),
  });

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
