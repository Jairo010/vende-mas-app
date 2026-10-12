import type { TaskEntity } from '../entities/task.entity';
import type {
  CreateTaskPayload,
  TaskFilterParams,
  TaskStatus,
  TransitionTaskPayload,
  UpdateTaskPayload,
  UpdateTaskStatusPayload,
} from '../types/task.types';

export interface PaginatedTasksResult {
  items: TaskEntity[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface UploadPhotoResult {
  photoUrl: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface ITaskRepositoryPort {
  findAll(filters?: TaskFilterParams): Promise<PaginatedTasksResult>;
  findById(id: string): Promise<TaskEntity>;
  create(payload: CreateTaskPayload): Promise<TaskEntity>;
  update(id: string, payload: UpdateTaskPayload): Promise<TaskEntity>;
  delete(id: string): Promise<void>;
  toggleStatus(id: string, currentStatus: TaskStatus): Promise<TaskEntity>;
  transition(id: string, payload: TransitionTaskPayload): Promise<TaskEntity>;
  updateStatus(id: string, payload: UpdateTaskStatusPayload): Promise<TaskEntity>;
  uploadPhoto(file: { uri: string; name: string; type: string }): Promise<UploadPhotoResult>;
}
