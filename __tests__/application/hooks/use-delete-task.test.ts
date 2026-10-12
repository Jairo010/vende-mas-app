import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteTask } from '@/application/hooks/tasks/use-delete-task';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';

describe('useDeleteTask hook', () => {
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
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      toggleStatus: jest.fn(),
      transition: jest.fn(),
      updateStatus: jest.fn(),
      uploadPhoto: jest.fn(),
    };
  });

  it('should call repository.delete and invalidate cache', async () => {
    const { result } = await renderHook(() => useDeleteTask(mockRepository), { wrapper });

    await act(async () => {
      await result.current.deleteTask('task-to-delete');
    });

    expect(mockRepository.delete).toHaveBeenCalledWith('task-to-delete');
    expect(result.current.isSuccess).toBe(true);
  });
});
