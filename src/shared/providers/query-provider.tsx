import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/** How long a screen trusts what it already read from the device database. */
export const LOCAL_DATA_STALE_TIME_MS = 5 * 60_000;

/**
 * Business queries read the device database (offline-first), so they never wait for the
 * network. Every local write and every sync that brings something invalidates them, so a
 * screen opened again shows what it had instead of reading SQLite during its transition
 * (ADR 0020); the stale time only bounds what depends on the clock (promotions in force).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      staleTime: LOCAL_DATA_STALE_TIME_MS,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'always',
      retry: false,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
