import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { apiClient } from '@/infrastructure/api/client/api-client';
import { API_ENDPOINTS } from '@/shared/constants/api.constants';
import type {
  ITaskRepositoryPort,
  PaginatedTasksResult,
  UploadPhotoResult,
} from '@/core/ports/task.repository.port';
import type {
  CreateTaskPayload,
  TaskFilterParams,
  TaskStatus,
  TransitionTaskPayload,
  UpdateTaskPayload,
  UpdateTaskStatusPayload,
} from '@/core/types/task.types';
import type { TaskEntity } from '@/core/entities/task.entity';
import type {
  CreateTaskRequestDto,
  FindTasksQueryDto,
  PaginatedTasksResponseDto,
  TaskResponseDto,
  TransitionTaskRequestDto,
  UpdateTaskRequestDto,
  UpdateTaskStatusRequestDto,
  UploadTaskPhotoResponseDto,
} from '@/infrastructure/api/dto/task.dto';
import type { ApiResponse } from '@/core/types/api.types';
import { TaskMapper } from '@/application/mappers/task.mapper';
import {
  DomainError,
  NetworkError,
  TaskNotFoundError,
  TaskUnauthorizedError,
  TaskValidationError,
} from '@/core/errors';

export class TaskApiService implements ITaskRepositoryPort {
  private readonly client: AxiosInstance;

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  public async findAll(filters?: TaskFilterParams): Promise<PaginatedTasksResult> {
    try {
      const params: FindTasksQueryDto = {};

      if (filters?.search) params.search = filters.search;
      if (filters?.userId) params.userId = filters.userId;
      if (filters?.customerId) params.customerId = filters.customerId;
      if (filters?.type) params.type = filters.type;
      if (filters?.category) params.category = filters.category;
      if (filters?.status) params.status = filters.status;
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.page !== undefined) params.page = filters.page;
      if (filters?.limit !== undefined) params.limit = filters.limit;
      if (filters?.sortBy) params.sortBy = filters.sortBy;
      if (filters?.sortDirection) params.sortDirection = filters.sortDirection;

      const response = await this.client.get<
        | ApiResponse<PaginatedTasksResponseDto | TaskResponseDto[]>
        | PaginatedTasksResponseDto
        | TaskResponseDto[]
      >(API_ENDPOINTS.tasks.list, { params });

      const rawData = this.unwrapResponse(response.data);

      if (Array.isArray(rawData)) {
        const items = rawData.map((dto) => TaskMapper.toDomain(dto as TaskResponseDto));
        return {
          items,
          total: items.length,
          page: filters?.page ?? 1,
          limit: filters?.limit ?? items.length,
          totalPages: 1,
        };
      }

      if (rawData && typeof rawData === 'object') {
        const paginatedObj = rawData as Record<string, unknown>;
        const rawList = Array.isArray(paginatedObj.data)
          ? paginatedObj.data
          : Array.isArray(paginatedObj.items)
            ? paginatedObj.items
            : [];

        const items = rawList.map((dto) => TaskMapper.toDomain(dto as TaskResponseDto));
        const meta = paginatedObj.meta as Record<string, unknown> | undefined;

        const total =
          typeof meta?.total === 'number'
            ? meta.total
            : typeof paginatedObj.total === 'number'
              ? paginatedObj.total
              : items.length;

        const page =
          typeof meta?.page === 'number'
            ? meta.page
            : typeof paginatedObj.page === 'number'
              ? paginatedObj.page
              : (filters?.page ?? 1);

        const limit =
          typeof meta?.limit === 'number'
            ? meta.limit
            : typeof paginatedObj.limit === 'number'
              ? paginatedObj.limit
              : (filters?.limit ?? 10);

        const totalPages =
          typeof meta?.totalPages === 'number'
            ? meta.totalPages
            : typeof paginatedObj.totalPages === 'number'
              ? paginatedObj.totalPages
              : Math.max(1, Math.ceil(total / (limit || 1)));

        return {
          items,
          total,
          page,
          limit,
          totalPages,
        };
      }

      return {
        items: [],
        total: 0,
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 10,
        totalPages: 1,
      };
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  public async findById(id: string): Promise<TaskEntity> {
    try {
      const response = await this.client.get<ApiResponse<TaskResponseDto> | TaskResponseDto>(
        API_ENDPOINTS.tasks.detail(id),
      );

      const rawData = this.unwrapResponse(response.data) as TaskResponseDto;
      return TaskMapper.toDomain(rawData);
    } catch (error: unknown) {
      this.handleError(error, id);
    }
  }

  public async create(payload: CreateTaskPayload): Promise<TaskEntity> {
    try {
      const dto: CreateTaskRequestDto = TaskMapper.toCreateDto(payload);
      const response = await this.client.post<ApiResponse<TaskResponseDto> | TaskResponseDto>(
        API_ENDPOINTS.tasks.list,
        dto,
      );

      const rawData = this.unwrapResponse(response.data) as TaskResponseDto;
      return TaskMapper.toDomain(rawData);
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  public async update(id: string, payload: UpdateTaskPayload): Promise<TaskEntity> {
    try {
      const dto: UpdateTaskRequestDto = TaskMapper.toUpdateDto(payload);
      const response = await this.client.patch<ApiResponse<TaskResponseDto> | TaskResponseDto>(
        API_ENDPOINTS.tasks.detail(id),
        dto,
      );

      const rawData = this.unwrapResponse(response.data) as TaskResponseDto;
      return TaskMapper.toDomain(rawData);
    } catch (error: unknown) {
      this.handleError(error, id);
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      await this.client.delete(API_ENDPOINTS.tasks.detail(id));
    } catch (error: unknown) {
      this.handleError(error, id);
    }
  }

  public async toggleStatus(id: string, currentStatus: TaskStatus): Promise<TaskEntity> {
    const nextStatus: TaskStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    return this.updateStatus(id, { status: nextStatus });
  }

  public async transition(id: string, payload: TransitionTaskPayload): Promise<TaskEntity> {
    try {
      const dto: TransitionTaskRequestDto = TaskMapper.toTransitionDto(payload);
      const response = await this.client.post<ApiResponse<TaskResponseDto> | TaskResponseDto>(
        API_ENDPOINTS.tasks.transition(id),
        dto,
      );

      const rawData = this.unwrapResponse(response.data) as TaskResponseDto;
      return TaskMapper.toDomain(rawData);
    } catch (error: unknown) {
      this.handleError(error, id);
    }
  }

  public async updateStatus(id: string, payload: UpdateTaskStatusPayload): Promise<TaskEntity> {
    try {
      const dto: UpdateTaskStatusRequestDto = TaskMapper.toUpdateStatusDto(payload);
      const response = await this.client.patch<ApiResponse<TaskResponseDto> | TaskResponseDto>(
        API_ENDPOINTS.tasks.status(id),
        dto,
      );

      const rawData = this.unwrapResponse(response.data) as TaskResponseDto;
      return TaskMapper.toDomain(rawData);
    } catch (error: unknown) {
      this.handleError(error, id);
    }
  }

  public async uploadPhoto(file: {
    uri: string;
    name: string;
    type: string;
  }): Promise<UploadPhotoResult> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);

      const response = await this.client.post<
        ApiResponse<UploadTaskPhotoResponseDto> | UploadTaskPhotoResponseDto
      >(API_ENDPOINTS.tasks.uploadPhoto, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const rawData = this.unwrapResponse(response.data) as UploadTaskPhotoResponseDto;
      return {
        photoUrl: rawData.photoUrl,
        originalName: rawData.originalName,
        size: rawData.size,
        mimeType: rawData.mimeType,
      };
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  private unwrapResponse(response: unknown): unknown {
    if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;
      if ('data' in obj && obj.data !== undefined) {
        return obj.data;
      }
    }
    return response;
  }

  private handleError(error: unknown, resourceId?: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseData = error.response?.data as Record<string, unknown> | undefined;
      const message = responseData?.message || error.message;

      if (status === 404) {
        throw new TaskNotFoundError(resourceId);
      }
      if (status === 401 || status === 403) {
        throw new TaskUnauthorizedError(typeof message === 'string' ? message : undefined);
      }
      if (status === 400 || status === 422) {
        throw new TaskValidationError(
          typeof message === 'string' ? message : 'Datos de tarea inválidos',
        );
      }
      if (!error.response) {
        throw new NetworkError(error.message || 'Error de conexión');
      }
    }

    if (error instanceof DomainError) {
      throw error;
    }

    throw error;
  }
}

export const taskApiService = new TaskApiService();
