import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVisits } from '@/application/hooks/visits/use-visits';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { VisitEntity } from '@/core/entities/visit.entity';

describe('useVisits', () => {
  it('reads the range from the local repository', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
    const visits = [{ id: 'visit-1' }] as unknown as VisitEntity[];
    const repository = {
      findByRange: jest.fn().mockResolvedValue(visits),
    } as unknown as jest.Mocked<IVisitRepositoryPort>;
    const filter = { from: '2026-10-14T05:00:00.000Z', to: '2026-10-15T04:59:59.999Z' };

    const { result } = await renderHook(() => useVisits(filter, repository), { wrapper });

    await waitFor(() => expect(result.current.visits).toHaveLength(1));
    expect(repository.findByRange).toHaveBeenCalledWith(filter);
  });
});
