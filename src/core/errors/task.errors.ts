import { DomainError } from './domain.error';

export class TaskNotFoundError extends DomainError {
  public readonly code = 'TASK_NOT_FOUND';
  constructor(message = 'Tarea no encontrada', details?: unknown) {
    super(message, 404, details);
  }
}

export class TaskValidationError extends DomainError {
  public readonly code = 'TASK_VALIDATION_ERROR';
  constructor(message = 'Datos de la tarea inválidos', details?: unknown) {
    super(message, 422, details);
  }
}

export class TaskUnauthorizedError extends DomainError {
  public readonly code = 'TASK_UNAUTHORIZED';
  constructor(message = 'No tienes permisos para modificar esta tarea', details?: unknown) {
    super(message, 403, details);
  }
}

export class TaskInvalidStatusTransitionError extends DomainError {
  public readonly code = 'TASK_INVALID_STATUS_TRANSITION';
  constructor(message = 'Transición de estado de tarea no permitida', details?: unknown) {
    super(message, 400, details);
  }
}
