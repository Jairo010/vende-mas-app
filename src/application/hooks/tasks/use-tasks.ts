import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/core/types/role.enum';
import type { TaskFilterParams } from '@/core/types/task.types';
import type { ITaskRepositoryPort, PaginatedTasksResult } from '@/core/ports/task.repository.port';
import { taskApiService } from '@/infrastructure/api/services/task-api.service';
import { tasksKeys } from './tasks.keys';

export function useTasks(
  filters?: TaskFilterParams,
  repository: ITaskRepositoryPort = taskApiService,
) {
  const user = useAuthStore((state) => state.user);

  // Scope to current user if seller
  const scopedFilters: TaskFilterParams = {
    ...filters,
    userId: user?.role === UserRole.SELLER ? user.id : (filters?.userId ?? undefined),
  };

  const query = useQuery<PaginatedTasksResult, Error>({
    queryKey: tasksKeys.list(scopedFilters),
    queryFn: () => repository.findAll(scopedFilters),
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    tasks: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    limit: query.data?.limit ?? 10,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
