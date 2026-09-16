export abstract class DomainError extends Error {
  public abstract readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends DomainError {
  public readonly code = 'AUTH_UNAUTHORIZED';
  constructor(message = 'No autorizado', details?: unknown) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends DomainError {
  public readonly code = 'AUTH_FORBIDDEN';
  constructor(message = 'Acceso denegado', details?: unknown) {
    super(message, 403, details);
  }
}

export class NotFoundError extends DomainError {
  public readonly code = 'NOT_FOUND';
  constructor(message = 'Recurso no encontrado', details?: unknown) {
    super(message, 404, details);
  }
}

export class ValidationError extends DomainError {
  public readonly code = 'VALIDATION_ERROR';
  constructor(message = 'Error de validación', details?: unknown) {
    super(message, 422, details);
  }
}

export class NetworkError extends DomainError {
  public readonly code = 'NETWORK_ERROR';
  constructor(message = 'Error de conexión de red', details?: unknown) {
    super(message, 0, details);
  }
}
