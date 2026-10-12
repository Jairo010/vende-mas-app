import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTransitionTask } from '@/application/hooks/tasks/use-transition-task';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import { TaskEntity } from '@/core/entities/task.entity';

describe('useTransitionTask hook', () => {
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
      delete: jest.fn(),
      toggleStatus: jest.fn(),
      transition: jest.fn(),
      updateStatus: jest.fn(),
      uploadPhoto: jest.fn(),
    };
  });

  it('should transition a task stage successfully', async () => {
    const updatedEntity = new TaskEntity({
      id: 'task-1',
      type: 'SALE',
      category: 'SALE',
      title: 'Venta cerrada',
      userId: 'usr-1',
      customerId: 'cust-1',
    });

    mockRepository.transition.mockResolvedValue(updatedEntity);

    const { result } = await renderHook(() => useTransitionTask(mockRepository), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'task-1',
        payload: {
          targetType: 'SALE',
          customerId: 'cust-1',
          notes: 'Propuesta aceptada',
        },
      });
    });

    expect(mockRepository.transition).toHaveBeenCalledWith('task-1', {
      targetType: 'SALE',
      customerId: 'cust-1',
      notes: 'Propuesta aceptada',
    });
    expect(result.current.data?.type).toBe('SALE');
  });
});
