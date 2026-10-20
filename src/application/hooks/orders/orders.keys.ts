import type { OrderFilter } from '@/core/types/order.types';

export const ordersKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersKeys.all, 'list'] as const,
  list: (filter: OrderFilter) => [...ordersKeys.lists(), filter] as const,
  details: () => [...ordersKeys.all, 'detail'] as const,
  detail: (id: string) => [...ordersKeys.details(), id] as const,
};
