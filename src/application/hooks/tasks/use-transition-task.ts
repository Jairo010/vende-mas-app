import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApiService } from '@/infrastructure/api/services/task-api.service';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { TransitionTaskPayload } from '@/core/types/task.types';
import { tasksKeys } from './tasks.keys';

export interface TransitionTaskVariables {
  id: string;
  payload: TransitionTaskPayload;
}

export function useTransitionTask(repository: ITaskRepositoryPort = taskApiService) {
  const queryClient = useQueryClient();

  return useMutation<TaskEntity, Error, TransitionTaskVariables>({
    mutationFn: ({ id, payload }) => repository.transition(id, payload),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.setQueryData(tasksKeys.detail(updatedTask.id), updatedTask);
    },
  });
}
