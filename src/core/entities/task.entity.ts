import type {
  TaskCategory,
  TaskCustomerSummary,
  TaskHistoryItem,
  TaskStatus,
  TaskType,
  TaskUserSummary,
} from '../types/task.types';
import { UserRole } from '../types/role.enum';
import { TaskValidationError } from '../errors/task.errors';

export interface TaskEntityProps {
  id: string;
  type?: TaskType;
  category?: TaskCategory;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  dueDate?: string | null;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  estimatedValue?: number | null;
  orderId?: string | null;
  previousTaskId?: string | null;
  userId: string;
  customerId?: string | null;
  customer?: TaskCustomerSummary | null;
  user?: TaskUserSummary | null;
  history?: TaskHistoryItem[];
  createdAt?: string;
  updatedAt?: string;
}

export class TaskEntity {
  public readonly id: string;
  public type: TaskType;
  public category: TaskCategory;
  public title: string;
  public description: string | null;
  public status: TaskStatus;
  public dueDate: string | null;
  public photoUrl: string | null;
  public latitude: number | null;
  public longitude: number | null;
  public estimatedValue: number | null;
  public orderId: string | null;
  public previousTaskId: string | null;
  public readonly userId: string;
  public customerId: string | null;
  public customer: TaskCustomerSummary | null;
  public user: TaskUserSummary | null;
  public history: TaskHistoryItem[];
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: TaskEntityProps) {
    if (!props.id || typeof props.id !== 'string') {
      throw new TaskValidationError('El identificador de la tarea es requerido');
    }

    const trimmedTitle = props.title?.trim();
    if (!trimmedTitle || trimmedTitle.length < 2 || trimmedTitle.length > 200) {
      throw new TaskValidationError('El título de la tarea debe tener entre 2 y 200 caracteres');
    }

    if (!props.userId || typeof props.userId !== 'string') {
      throw new TaskValidationError('El identificador de usuario asignado es requerido');
    }

    // Resolve type & category with fallback compatibility
    const resolvedType: TaskType =
      props.type ||
      (props.category === 'SALE' ||
      props.category === 'COLLECTION' ||
      props.category === 'OPPORTUNITY' ||
      props.category === 'VISIT'
        ? (props.category as TaskType)
        : 'OPPORTUNITY');

    const customerId = props.customerId ?? null;

    // Enforce mandatory customer invariant for SALE and COLLECTION
    if ((resolvedType === 'SALE' || resolvedType === 'COLLECTION') && !customerId) {
      throw new TaskValidationError('Para ventas y cobranzas es obligatorio asignar un cliente');
    }

    const now = new Date().toISOString();

    this.id = props.id;
    this.type = resolvedType;
    this.category = (props.category || resolvedType) as TaskCategory;
    this.title = trimmedTitle;
    this.description = props.description ?? null;
    this.status = props.status ?? 'PENDING';
    this.dueDate = props.dueDate ?? null;
    this.photoUrl = props.photoUrl ?? null;
    this.latitude = props.latitude !== undefined ? props.latitude : null;
    this.longitude = props.longitude !== undefined ? props.longitude : null;
    this.estimatedValue = props.estimatedValue !== undefined ? props.estimatedValue : null;
    this.orderId = props.orderId ?? null;
    this.previousTaskId = props.previousTaskId ?? null;
    this.userId = props.userId;
    this.customerId = customerId;
    this.customer = props.customer ?? null;
    this.user = props.user ?? null;
    this.history = props.history ? [...props.history] : [];
    this.createdAt = props.createdAt ?? now;
    this.updatedAt = props.updatedAt ?? now;
  }

  public isOpportunity(): boolean {
    return this.type === 'OPPORTUNITY';
  }

  public isVisit(): boolean {
    return this.type === 'VISIT';
  }

  public isSale(): boolean {
    return this.type === 'SALE';
  }

  public isCollection(): boolean {
    return this.type === 'COLLECTION';
  }

  public isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }

  public isPending(): boolean {
    return this.status === 'PENDING';
  }

  public isInProgress(): boolean {
    return this.status === 'IN_PROGRESS';
  }

  public isLost(): boolean {
    return this.status === 'LOST';
  }

  public isCollected(): boolean {
    return this.status === 'COLLECTED';
  }

  public isCancelled(): boolean {
    return this.status === 'CANCELLED';
  }

  public isOverdue(): boolean {
    if (
      !this.dueDate ||
      this.isCompleted() ||
      this.isCancelled() ||
      this.isLost() ||
      this.isCollected()
    ) {
      return false;
    }
    const dueTime = new Date(this.dueDate).getTime();
    return !Number.isNaN(dueTime) && dueTime < Date.now();
  }

  public changeStatus(
    newStatus: TaskStatus,
    options?: {
      latitude?: number | null;
      longitude?: number | null;
      photoUrl?: string | null;
      notes?: string | null;
    },
  ): void {
    const fromStatus = this.status;
    this.status = newStatus;
    if (options?.latitude !== undefined) this.latitude = options.latitude;
    if (options?.longitude !== undefined) this.longitude = options.longitude;
    if (options?.photoUrl !== undefined) this.photoUrl = options.photoUrl;

    const now = new Date().toISOString();
    this.updatedAt = now;

    // Record in local history
    this.history.push({
      id: `hist_${Date.now()}`,
      taskId: this.id,
      fromType: this.type,
      toType: this.type,
      fromStatus,
      toStatus: newStatus,
      userId: this.userId,
      latitude: options?.latitude ?? this.latitude,
      longitude: options?.longitude ?? this.longitude,
      photoUrl: options?.photoUrl ?? this.photoUrl,
      notes: options?.notes ?? null,
      createdAt: now,
      user: this.user,
    });
  }

  public transitionType(
    targetType: TaskType,
    options?: {
      targetStatus?: TaskStatus;
      customerId?: string | null;
      dueDate?: string | null;
      orderId?: string | null;
      photoUrl?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      notes?: string | null;
    },
  ): void {
    const finalCustomerId =
      options?.customerId !== undefined ? options.customerId : this.customerId;
    if ((targetType === 'SALE' || targetType === 'COLLECTION') && !finalCustomerId) {
      throw new TaskValidationError('Para ventas y cobranzas es obligatorio asignar un cliente');
    }

    const fromType = this.type;
    const fromStatus = this.status;
    const toStatus = options?.targetStatus ?? this.status;

    this.type = targetType;
    this.category = targetType;
    if (options?.targetStatus) this.status = options.targetStatus;
    if (options?.customerId !== undefined) this.customerId = options.customerId;
    if (options?.dueDate !== undefined) this.dueDate = options.dueDate;
    if (options?.orderId !== undefined) this.orderId = options.orderId;
    if (options?.photoUrl !== undefined) this.photoUrl = options.photoUrl;
    if (options?.latitude !== undefined) this.latitude = options.latitude;
    if (options?.longitude !== undefined) this.longitude = options.longitude;

    const now = new Date().toISOString();
    this.updatedAt = now;

    this.history.push({
      id: `hist_${Date.now()}`,
      taskId: this.id,
      fromType,
      toType: targetType,
      fromStatus,
      toStatus,
      userId: this.userId,
      latitude: options?.latitude ?? this.latitude,
      longitude: options?.longitude ?? this.longitude,
      photoUrl: options?.photoUrl ?? this.photoUrl,
      notes: options?.notes ?? null,
      createdAt: now,
      user: this.user,
    });
  }

  public updateDetails(params: {
    title?: string;
    description?: string | null;
    type?: TaskType;
    category?: TaskCategory;
    dueDate?: string | null;
    customerId?: string | null;
    estimatedValue?: number | null;
    photoUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    orderId?: string | null;
  }): void {
    if (params.title !== undefined) {
      const trimmed = params.title.trim();
      if (trimmed.length < 2 || trimmed.length > 200) {
        throw new TaskValidationError('El título debe tener entre 2 y 200 caracteres');
      }
      this.title = trimmed;
    }

    if (params.description !== undefined) {
      this.description = params.description;
    }

    if (params.type !== undefined) {
      this.type = params.type;
      this.category = params.type;
    } else if (params.category !== undefined) {
      this.category = params.category;
    }

    if (params.dueDate !== undefined) {
      this.dueDate = params.dueDate;
    }

    if (params.customerId !== undefined) {
      this.customerId = params.customerId;
    }

    if (params.estimatedValue !== undefined) {
      this.estimatedValue = params.estimatedValue;
    }

    if (params.photoUrl !== undefined) {
      this.photoUrl = params.photoUrl;
    }

    if (params.latitude !== undefined) {
      this.latitude = params.latitude;
    }

    if (params.longitude !== undefined) {
      this.longitude = params.longitude;
    }

    if (params.orderId !== undefined) {
      this.orderId = params.orderId;
    }

    this.updatedAt = new Date().toISOString();
  }

  public canBeModifiedBy(
    userOrId: { id: string; role: UserRole } | string,
    role?: UserRole,
  ): boolean {
    if (typeof userOrId === 'string') {
      return role === UserRole.ADMIN || this.userId === userOrId;
    }
    return userOrId.role === UserRole.ADMIN || this.userId === userOrId.id;
  }

  public canBeDeletedBy(
    userOrId: { id: string; role: UserRole } | string,
    role?: UserRole,
  ): boolean {
    if (typeof userOrId === 'string') {
      return role === UserRole.ADMIN || this.userId === userOrId;
    }
    return userOrId.role === UserRole.ADMIN || this.userId === userOrId.id;
  }
}
