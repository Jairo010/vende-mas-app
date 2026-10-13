import type { ProductFilter } from '@/core/types/catalog.types';

export const catalogKeys = {
  all: ['catalog'] as const,
  products: (filter: ProductFilter) => [...catalogKeys.all, 'products', filter] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
};
