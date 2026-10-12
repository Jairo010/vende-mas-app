import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import { taskApiService } from '@/infrastructure/api/services/task-api.service';
import { tasksKeys } from './tasks.keys';

export function useDeleteTask(repository: ITaskRepositoryPort = taskApiService) {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      return repository.delete(id);
    },
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tasksKeys.lists() }),
        queryClient.removeQueries({ queryKey: tasksKeys.detail(id) }),
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
    deleteTask: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
