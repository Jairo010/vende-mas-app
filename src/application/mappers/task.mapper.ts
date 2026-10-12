import { TaskEntity } from '@/core/entities/task.entity';
import type {
  CreateTaskPayload,
  TaskCategory,
  TaskCustomerSummary,
  TaskHistoryItem,
  TaskStatus,
  TaskType,
  TaskUserSummary,
  TransitionTaskPayload,
  UpdateTaskPayload,
  UpdateTaskStatusPayload,
} from '@/core/types/task.types';
import type {
  CreateTaskRequestDto,
  TaskCustomerSummaryDto,
  TaskHistoryResponseDto,
  TaskResponseDto,
  TaskUserSummaryDto,
  TransitionTaskRequestDto,
  UpdateTaskRequestDto,
  UpdateTaskStatusRequestDto,
} from '@/infrastructure/api/dto/task.dto';

export class TaskMapper {
  public static toDomainType(type?: unknown, category?: unknown): TaskType {
    const candidate =
      typeof type === 'string' ? type : typeof category === 'string' ? category : '';
    const normalized = candidate.trim().toUpperCase();

    if (
      normalized === 'OPPORTUNITY' ||
      normalized === 'VISIT' ||
      normalized === 'SALE' ||
      normalized === 'COLLECTION'
    ) {
      return normalized as TaskType;
    }

    if (normalized === 'NEW_CUSTOMER') return 'OPPORTUNITY';
    return 'OPPORTUNITY';
  }

  public static toDomainCategory(category?: unknown, type?: unknown): TaskCategory {
    if (typeof category === 'string' && category.trim()) {
      const norm = category.trim().toUpperCase();
      const validCategories: TaskCategory[] = [
        'SALE',
        'COLLECTION',
        'NEW_CUSTOMER',
        'OPPORTUNITY',
        'VISIT',
        'GENERAL',
      ];
      if (validCategories.includes(norm as TaskCategory)) {
        return norm as TaskCategory;
      }
    }
    return this.toDomainType(type, category);
  }

  public static toDomainStatus(status?: unknown): TaskStatus {
    if (!status || typeof status !== 'string') {
      return 'PENDING';
    }

    const normalized = status.trim().toUpperCase();
    const validStatuses: TaskStatus[] = [
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'LOST',
      'COLLECTED',
      'CANCELLED',
    ];

    if (validStatuses.includes(normalized as TaskStatus)) {
      return normalized as TaskStatus;
    }

    return 'PENDING';
  }

  public static toDomainCustomer(dto?: TaskCustomerSummaryDto | null): TaskCustomerSummary | null {
    if (!dto || typeof dto !== 'object' || !dto.id) {
      return null;
    }

    return {
      id: String(dto.id),
      identification: dto.identification ? String(dto.identification) : undefined,
      name: String(dto.name || ''),
      phone: dto.phone ?? null,
      address: dto.address ?? null,
      latitude: typeof dto.latitude === 'number' ? dto.latitude : null,
      longitude: typeof dto.longitude === 'number' ? dto.longitude : null,
    };
  }

  public static toDomainUser(
    dto?: TaskUserSummaryDto | { id: string; name: string; email: string } | null,
  ): TaskUserSummary | null {
    if (!dto || typeof dto !== 'object' || !dto.id) {
      return null;
    }

    return {
      id: String(dto.id),
      name: String(dto.name || ''),
      email: String(dto.email || ''),
    };
  }

  public static toDomainHistoryItem(dto: TaskHistoryResponseDto): TaskHistoryItem {
    return {
      id: String(dto.id),
      taskId: String(dto.taskId),
      fromType: dto.fromType ? String(dto.fromType) : null,
      toType: String(dto.toType || 'OPPORTUNITY'),
      fromStatus: dto.fromStatus ? String(dto.fromStatus) : null,
      toStatus: String(dto.toStatus || 'PENDING'),
      userId: String(dto.userId),
      latitude: typeof dto.latitude === 'number' ? dto.latitude : null,
      longitude: typeof dto.longitude === 'number' ? dto.longitude : null,
      photoUrl: dto.photoUrl ? String(dto.photoUrl) : null,
      notes: dto.notes ? String(dto.notes) : null,
      createdAt: String(dto.createdAt || new Date().toISOString()),
      user: this.toDomainUser(dto.user),
    };
  }

  public static toDomain(dto: TaskResponseDto | Record<string, unknown>): TaskEntity {
    const raw = dto as Record<string, unknown>;

    const id = String(raw.id || '');
    const type = this.toDomainType(raw.type, raw.category);
    const category = this.toDomainCategory(raw.category, raw.type);
    const title = String(raw.title || '');
    const description =
      raw.description !== undefined && raw.description !== null ? String(raw.description) : null;
    const status = this.toDomainStatus(raw.status);
    const dueDate = raw.dueDate !== undefined && raw.dueDate !== null ? String(raw.dueDate) : null;
    const photoUrl = raw.photoUrl ? String(raw.photoUrl) : null;
    const latitude = typeof raw.latitude === 'number' ? raw.latitude : null;
    const longitude = typeof raw.longitude === 'number' ? raw.longitude : null;
    const estimatedValue = typeof raw.estimatedValue === 'number' ? raw.estimatedValue : null;
    const orderId = raw.orderId ? String(raw.orderId) : null;
    const previousTaskId = raw.previousTaskId ? String(raw.previousTaskId) : null;
    const userId = String(raw.userId || raw.assignedToId || raw.assignedUserId || '');
    const customerId =
      raw.customerId !== undefined && raw.customerId !== null ? String(raw.customerId) : null;

    const customer = this.toDomainCustomer(raw.customer as TaskCustomerSummaryDto);
    const user = this.toDomainUser(raw.user as TaskUserSummaryDto);

    const rawHistory = Array.isArray(raw.history) ? raw.history : [];
    const history = rawHistory.map((item) =>
      this.toDomainHistoryItem(item as TaskHistoryResponseDto),
    );

    const createdAt = raw.createdAt ? String(raw.createdAt) : undefined;
    const updatedAt = raw.updatedAt ? String(raw.updatedAt) : undefined;

    return new TaskEntity({
      id,
      type,
      category,
      title,
      description,
      status,
      dueDate,
      photoUrl,
      latitude,
      longitude,
      estimatedValue,
      orderId,
      previousTaskId,
      userId,
      customerId,
      customer,
      user,
      history,
      createdAt,
      updatedAt,
    });
  }

  public static toCreateDto(payload: CreateTaskPayload): CreateTaskRequestDto {
    const resolvedType = payload.type || (payload.category as TaskType) || 'OPPORTUNITY';
    return {
      type: resolvedType,
      category: payload.category ?? resolvedType,
      title: payload.title.trim(),
      description: payload.description ? payload.description.trim() : null,
      dueDate: payload.dueDate ?? null,
      customerId: payload.customerId ?? null,
      estimatedValue:
        payload.estimatedValue !== undefined && payload.estimatedValue !== null
          ? Number(payload.estimatedValue)
          : null,
      photoUrl: payload.photoUrl ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      orderId: payload.orderId ?? null,
      userId: payload.userId,
    };
  }

  public static toUpdateDto(payload: UpdateTaskPayload): UpdateTaskRequestDto {
    const dto: UpdateTaskRequestDto = {};

    if (payload.title !== undefined) {
      dto.title = payload.title.trim();
    }
    if (payload.description !== undefined) {
      dto.description = payload.description ? payload.description.trim() : null;
    }
    if (payload.type !== undefined) {
      dto.type = payload.type;
      dto.category = payload.type;
    } else if (payload.category !== undefined) {
      dto.category = payload.category;
    }
    if (payload.status !== undefined) {
      dto.status = payload.status;
    }
    if (payload.dueDate !== undefined) {
      dto.dueDate = payload.dueDate;
    }
    if (payload.customerId !== undefined) {
      dto.customerId = payload.customerId;
    }
    if (payload.estimatedValue !== undefined) {
      dto.estimatedValue = payload.estimatedValue !== null ? Number(payload.estimatedValue) : null;
    }
    if (payload.photoUrl !== undefined) {
      dto.photoUrl = payload.photoUrl;
    }
    if (payload.latitude !== undefined) {
      dto.latitude = payload.latitude;
    }
    if (payload.longitude !== undefined) {
      dto.longitude = payload.longitude;
    }
    if (payload.orderId !== undefined) {
      dto.orderId = payload.orderId;
    }
    if (payload.userId !== undefined) {
      dto.userId = payload.userId;
    }

    return dto;
  }

  public static toTransitionDto(payload: TransitionTaskPayload): TransitionTaskRequestDto {
    return {
      targetType: payload.targetType,
      targetStatus: payload.targetStatus,
      customerId: payload.customerId ?? null,
      dueDate: payload.dueDate ?? null,
      orderId: payload.orderId ?? null,
      photoUrl: payload.photoUrl ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      notes: payload.notes ? payload.notes.trim() : null,
    };
  }

  public static toUpdateStatusDto(payload: UpdateTaskStatusPayload): UpdateTaskStatusRequestDto {
    return {
      status: payload.status,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      photoUrl: payload.photoUrl ?? null,
      notes: payload.notes ? payload.notes.trim() : null,
    };
  }
}
