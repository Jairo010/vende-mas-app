export type TaskType = 'OPPORTUNITY' | 'VISIT' | 'SALE' | 'COLLECTION';

export type TaskCategory =
  TaskType | 'SALE' | 'COLLECTION' | 'NEW_CUSTOMER' | 'OPPORTUNITY' | 'GENERAL';

export type TaskStatus =
  'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'LOST' | 'COLLECTED' | 'CANCELLED';

export type TaskStatusType = TaskStatus;

export interface TaskCustomerSummary {
  id: string;
  identification?: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TaskUserSummary {
  id: string;
  name: string;
  email: string;
}

export interface TaskHistoryItem {
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
  readonly user?: TaskUserSummary | null;
}

export interface TaskFilterParams {
  search?: string;
  userId?: string;
  customerId?: string;
  type?: TaskType;
  category?: TaskCategory;
  status?: TaskStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CreateTaskPayload {
  type?: TaskType;
  category?: TaskCategory;
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

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  type?: TaskType;
  category?: TaskCategory;
  status?: TaskStatus;
  dueDate?: string | null;
  customerId?: string | null;
  estimatedValue?: number | null;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  orderId?: string | null;
  userId?: string;
}

export interface TransitionTaskPayload {
  targetType: TaskType;
  targetStatus?: TaskStatus;
  customerId?: string | null;
  dueDate?: string | null;
  orderId?: string | null;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
  notes?: string | null;
}
