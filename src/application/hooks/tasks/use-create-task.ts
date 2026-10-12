import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/auth.store';
import type { CreateTaskPayload } from '@/core/types/task.types';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import { taskApiService } from '@/infrastructure/api/services/task-api.service';
import { tasksKeys } from './tasks.keys';

export function useCreateTask(repository: ITaskRepositoryPort = taskApiService) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const mutation = useMutation<TaskEntity, Error, CreateTaskPayload>({
    mutationFn: async (payload: CreateTaskPayload) => {
      const fullPayload: CreateTaskPayload = {
        ...payload,
        userId: payload.userId || user?.id || '',
      };
      return repository.create(fullPayload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
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
    createTask: mutation.mutateAsync,
    isCreating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
