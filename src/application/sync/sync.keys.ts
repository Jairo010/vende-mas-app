import type { QueryKey } from '@tanstack/react-query';

export const syncKeys = {
  all: ['sync'] as const,
  outbox: () => [...syncKeys.all, 'outbox'] as const,
  rejected: () => [...syncKeys.all, 'rejected'] as const,
  pending: () => [...syncKeys.all, 'pending'] as const,
};

/**
 * Roots of every query served from the local database. After a sync applies server
 * changes they are invalidated so screens re-read SQLite.
 */
export const LOCAL_DATA_QUERY_ROOTS: readonly QueryKey[] = [
  ['visits'],
  ['customers'],
  ['orders'],
  ['catalog'],
  syncKeys.all,
];
