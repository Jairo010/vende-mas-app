import type { VisitFilter } from '@/core/types/visit.types';

export const visitsKeys = {
  all: ['visits'] as const,
  lists: () => [...visitsKeys.all, 'list'] as const,
  list: (filter: VisitFilter) => [...visitsKeys.lists(), filter] as const,
  details: () => [...visitsKeys.all, 'detail'] as const,
  detail: (id: string) => [...visitsKeys.details(), id] as const,
  inProgress: (sellerId: string) => [...visitsKeys.all, 'in-progress', sellerId] as const,
};
