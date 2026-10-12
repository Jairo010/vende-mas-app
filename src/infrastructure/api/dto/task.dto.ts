export interface TaskCustomerSummaryDto {
  id: string;
  identification?: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TaskUserSummaryDto {
  id: string;
  name: string;
  email: string;
}

export interface TaskHistoryResponseDto {
  readonly id: string;
  readonly taskId: string;
  readonly fromType: string | null;
  readonly toType: string;
  readonly fromStatus: string | null;
  readonly toStatus: string;
  readonly userId: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly photoUrl: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly user?: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  } | null;
}

export interface CreateTaskRequestDto {
  type?: string;
  category?: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  customerId?: string | null;
  estimatedValue?: number | null;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  orderId?: string | null;
  userId?: string;
}

export interface UpdateTaskRequestDto {
  title?: string;
  description?: string | null;
  type?: string;
  category?: string;
  status?: string;
  dueDate?: string | null;
  customerId?: string | null;
  estimatedValue?: number | null;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  orderId?: string | null;
  userId?: string;
}

export interface TransitionTaskRequestDto {
  targetType: string;
  targetStatus?: string;
  customerId?: string | null;
  dueDate?: string | null;
  orderId?: string | null;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

export interface UpdateTaskStatusRequestDto {
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
  notes?: string | null;
}

export interface UploadTaskPhotoResponseDto {
  photoUrl: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface FindTasksQueryDto {
  search?: string;
  userId?: string;
  customerId?: string;
  type?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface TaskResponseDto {
  readonly id: string;
  readonly type?: string;
  readonly category?: string;
  readonly title: string;
  readonly description?: string | null;
  readonly status: string;
  readonly dueDate?: string | null;
  readonly photoUrl?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly estimatedValue?: number | null;
  readonly orderId?: string | null;
  readonly previousTaskId?: string | null;
  readonly userId: string;
  readonly customerId?: string | null;
  readonly customer?: TaskCustomerSummaryDto | null;
  readonly user?: TaskUserSummaryDto | null;
  readonly history?: readonly TaskHistoryResponseDto[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaginatedTasksResponseDto {
  data: TaskResponseDto[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}
