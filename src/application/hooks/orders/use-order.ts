import { useQuery } from '@tanstack/react-query';
import type { OrderEntity } from '@/core/entities/order.entity';
import type { IOrderRepositoryPort } from '@/core/ports/order.repository.port';
import { sqliteOrderRepository } from '@/infrastructure/database/repositories/sqlite-order.repository';
import { ordersKeys } from './orders.keys';

export function useOrder(
  id: string | undefined,
  repository: IOrderRepositoryPort = sqliteOrderRepository,
) {
  const query = useQuery<OrderEntity | null, Error>({
    queryKey: ordersKeys.detail(id ?? ''),
    queryFn: () => repository.findById(id as string),
    enabled: Boolean(id),
  });

  return { order: query.data ?? null, isLoading: query.isLoading };
}
