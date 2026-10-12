import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { UpdateTaskPayload } from '@/core/types/task.types';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import { taskApiService } from '@/infrastructure/api/services/task-api.service';
import { tasksKeys } from './tasks.keys';

export interface UpdateTaskVariables {
  id: string;
  payload: UpdateTaskPayload;
}

export function useUpdateTask(repository: ITaskRepositoryPort = taskApiService) {
  const queryClient = useQueryClient();

  const mutation = useMutation<TaskEntity, Error, UpdateTaskVariables>({
    mutationFn: async ({ id, payload }: UpdateTaskVariables) => {
      return repository.update(id, payload);
    },
    onSuccess: async (updatedTask) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tasksKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: tasksKeys.detail(updatedTask.id) }),
      ]);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Ignore haptics failure
      }
    },
    onError: async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Ignore haptics failure
      }
    },
  });

  return {
    updateTask: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
