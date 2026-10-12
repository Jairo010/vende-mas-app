import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApiService } from '@/infrastructure/api/services/task-api.service';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { UpdateTaskStatusPayload } from '@/core/types/task.types';
import { tasksKeys } from './tasks.keys';

export interface UpdateTaskStatusVariables {
  id: string;
  payload: UpdateTaskStatusPayload;
}

export function useUpdateTaskStatus(repository: ITaskRepositoryPort = taskApiService) {
  const queryClient = useQueryClient();

  return useMutation<TaskEntity, Error, UpdateTaskStatusVariables>({
    mutationFn: ({ id, payload }) => repository.updateStatus(id, payload),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.setQueryData(tasksKeys.detail(updatedTask.id), updatedTask);
    },
  });
}
