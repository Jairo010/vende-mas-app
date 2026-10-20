import type { ProductFilter } from '@/core/types/catalog.types';

export const catalogKeys = {
  all: ['catalog'] as const,
  products: (filter: ProductFilter) => [...catalogKeys.all, 'products', filter] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  productsByIds: (ids: readonly string[]) => [...catalogKeys.all, 'by-ids', ids] as const,
  activePromotions: () => [...catalogKeys.all, 'promotions', 'active'] as const,
};
