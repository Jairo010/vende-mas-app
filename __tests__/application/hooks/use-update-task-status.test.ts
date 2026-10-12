import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateTaskStatus } from '@/application/hooks/tasks/use-update-task-status';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import { TaskEntity } from '@/core/entities/task.entity';

describe('useUpdateTaskStatus hook', () => {
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

  it('should update task status with GPS coordinates and notes', async () => {
    const updatedEntity = new TaskEntity({
      id: 'task-1',
      type: 'OPPORTUNITY',
      title: 'Visita perdida',
      status: 'LOST',
      userId: 'usr-1',
    });

    mockRepository.updateStatus.mockResolvedValue(updatedEntity);

    const { result } = await renderHook(() => useUpdateTaskStatus(mockRepository), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'task-1',
        payload: {
          status: 'LOST',
          latitude: -0.18,
          longitude: -78.46,
          notes: 'No presupuesto',
        },
      });
    });

    expect(mockRepository.updateStatus).toHaveBeenCalledWith('task-1', {
      status: 'LOST',
      latitude: -0.18,
      longitude: -78.46,
      notes: 'No presupuesto',
    });
    expect(result.current.data?.status).toBe('LOST');
  });
});
