import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * Business queries read the device database (offline-first), so they never wait for the
 * network: the sync engine refreshes SQLite and invalidates them after each run.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      staleTime: 1000 * 30,
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
