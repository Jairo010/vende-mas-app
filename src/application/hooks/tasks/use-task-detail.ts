import { useQuery } from '@tanstack/react-query';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { ITaskRepositoryPort } from '@/core/ports/task.repository.port';
import { taskApiService } from '@/infrastructure/api/services/task-api.service';
import { tasksKeys } from './tasks.keys';

export function useTaskDetail(id: string, repository: ITaskRepositoryPort = taskApiService) {
  const query = useQuery<TaskEntity, Error>({
    queryKey: tasksKeys.detail(id),
    queryFn: () => repository.findById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

  return {
    task: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
