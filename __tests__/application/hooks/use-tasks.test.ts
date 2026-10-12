import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTasks } from '@/application/hooks/tasks/use-tasks';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/core/types/role.enum';
import { TaskEntity } from '@/core/entities/task.entity';

describe('useTasks hook', () => {
  let queryClient: QueryClient;
  let mockRepository: jest.Mocked<ITaskRepositoryPort>;

  const mockTasks = [
    new TaskEntity({
      id: 'task-1',
      title: 'Visita de prospección',
      category: 'SALE',
      status: 'PENDING',
      userId: 'seller-123',
      customerId: 'cust-1',
    }),
  ];

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockRepository = {
      findAll: jest.fn().mockResolvedValue({
        items: mockTasks,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      toggleStatus: jest.fn(),
      transition: jest.fn(),
      updateStatus: jest.fn(),
      uploadPhoto: jest.fn(),
    };
  });

  it('should scope userId to current user if role is SELLER', async () => {
    useAuthStore.getState().setUser({
      id: 'seller-123',
      email: 'seller@vendemas.com',
      name: 'Seller User',
      role: UserRole.SELLER,
      isActive: true,
    });

    const { result } = await renderHook(() => useTasks({}, mockRepository), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'seller-123',
      }),
    );
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.total).toBe(1);
  });

  it('should not overwrite userId if role is ADMIN', async () => {
    useAuthStore.getState().setUser({
      id: 'admin-999',
      email: 'admin@vendemas.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    });

    const { result } = await renderHook(
      () => useTasks({ search: 'demo' }, mockRepository),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'demo',
        userId: undefined,
      }),
    );
  });
});
