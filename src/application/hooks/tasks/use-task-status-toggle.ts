import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { TaskStatus } from '@/core/types/task.types';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { ITaskRepositoryPort, PaginatedTasksResult } from '@/core/ports/task.repository.port';
import { taskApiService } from '@/infrastructure/api/services/task-api.service';
import { tasksKeys } from './tasks.keys';

export interface ToggleStatusVariables {
  id: string;
  currentStatus: TaskStatus;
}

export function useTaskStatusToggle(repository: ITaskRepositoryPort = taskApiService) {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    TaskEntity,
    Error,
    ToggleStatusVariables,
    { previousLists: Array<[readonly unknown[], PaginatedTasksResult | undefined]> }
  >({
    mutationFn: async ({ id, currentStatus }: ToggleStatusVariables) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Ignore haptics failure
      }
      return repository.toggleStatus(id, currentStatus);
    },
    onMutate: async ({ id, currentStatus }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });

      // Snapshot previous list values
      const matchingQueries = queryClient.getQueriesData<PaginatedTasksResult>({
        queryKey: tasksKeys.lists(),
      });
      const previousLists = matchingQueries.map(
        ([queryKey, data]) =>
          [queryKey, data] as [readonly unknown[], PaginatedTasksResult | undefined],
      );

      const nextStatus: TaskStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

      // Optimistically update lists
      matchingQueries.forEach(([queryKey, oldData]) => {
        if (!oldData) return;
        queryClient.setQueryData<PaginatedTasksResult>(queryKey, {
          ...oldData,
          items: oldData.items.map((item) => {
            if (item.id === id) {
              return Object.assign(Object.create(Object.getPrototypeOf(item)), item, {
                status: nextStatus,
                updatedAt: new Date().toISOString(),
              });
            }
            return item;
          }),
        });
      });

      return { previousLists };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } catch {
        // Ignore
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
    },
  });

  return {
    toggleStatus: mutation.mutateAsync,
    isToggling: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
