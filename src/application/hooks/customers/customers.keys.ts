import type { CustomerFilter } from '@/core/types/customer.types';

export const customersKeys = {
  all: ['customers'] as const,
  lists: () => [...customersKeys.all, 'list'] as const,
  list: (filter: CustomerFilter) => [...customersKeys.lists(), filter] as const,
  details: () => [...customersKeys.all, 'detail'] as const,
  detail: (id: string) => [...customersKeys.details(), id] as const,
};
