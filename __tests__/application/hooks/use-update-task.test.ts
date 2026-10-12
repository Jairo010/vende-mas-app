import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateTask } from '@/application/hooks/tasks/use-update-task';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import { TaskEntity } from '@/core/entities/task.entity';

describe('useUpdateTask hook', () => {
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
      create: jest.fn(),
      update: jest.fn().mockImplementation(async (id, payload) => {
        return new TaskEntity({
          id,
          title: payload.title || 'Updated Task',
          category: payload.category || 'GENERAL',
          status: payload.status || 'PENDING',
          userId: 'usr-1',
        });
      }),
      delete: jest.fn(),
      toggleStatus: jest.fn(),
      transition: jest.fn(),
      updateStatus: jest.fn(),
      uploadPhoto: jest.fn(),
    };
  });

  it('should call repository.update and succeed', async () => {
    const { result } = await renderHook(() => useUpdateTask(mockRepository), { wrapper });

    await act(async () => {
      await result.current.updateTask({
        id: 'task-1',
        payload: { status: 'COMPLETED' },
      });
    });

    expect(mockRepository.update).toHaveBeenCalledWith('task-1', {
      status: 'COMPLETED',
    });
    expect(result.current.isSuccess).toBe(true);
  });
});
