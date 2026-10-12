import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateTask } from '@/application/hooks/tasks/use-create-task';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/core/types/role.enum';
import { TaskEntity } from '@/core/entities/task.entity';

describe('useCreateTask hook', () => {
  let queryClient: QueryClient;
  let mockRepository: jest.Mocked<ITaskRepositoryPort>;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });

    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn().mockImplementation(async (payload) => {
        return new TaskEntity({
          id: 'created-id',
          title: payload.title,
          category: payload.category || 'GENERAL',
          status: 'PENDING',
          userId: payload.userId,
        });
      }),
      update: jest.fn(),
      delete: jest.fn(),
      toggleStatus: jest.fn(),
      transition: jest.fn(),
      updateStatus: jest.fn(),
      uploadPhoto: jest.fn(),
    };

    useAuthStore.getState().setUser({
      id: 'current-user-1',
      email: 'user@vendemas.com',
      name: 'Current User',
      role: UserRole.SELLER,
      isActive: true,
    });
  });

  it('should call repository.create and set userId from auth store if omitted', async () => {
    const { result } = await renderHook(() => useCreateTask(mockRepository), { wrapper });

    await act(async () => {
      await result.current.createTask({
        title: 'Nueva tarea comercial',
        category: 'OPPORTUNITY',
      });
    });

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nueva tarea comercial',
        category: 'OPPORTUNITY',
        userId: 'current-user-1',
      }),
    );
    expect(result.current.isSuccess).toBe(true);
  });
});
