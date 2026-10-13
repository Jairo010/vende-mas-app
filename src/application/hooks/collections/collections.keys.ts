import type { PaymentFilter, ReceivableFilter } from '@/core/types/collection.types';

export const collectionsKeys = {
  all: ['collections'] as const,
  receivables: (filter: ReceivableFilter) =>
    [...collectionsKeys.all, 'receivables', filter] as const,
  receivable: (id: string) => [...collectionsKeys.all, 'receivable', id] as const,
  payments: (filter: PaymentFilter) => [...collectionsKeys.all, 'payments', filter] as const,
  payment: (id: string) => [...collectionsKeys.all, 'payment', id] as const,
  balance: (customerId: string) => [...collectionsKeys.all, 'balance', customerId] as const,
  settings: () => [...collectionsKeys.all, 'settings'] as const,
};
