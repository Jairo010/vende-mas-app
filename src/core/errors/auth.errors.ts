import { DomainError } from './domain.error';

export class InvalidCredentialsError extends DomainError {
  public readonly code = 'AUTH_INVALID_CREDENTIALS';

  constructor(message = 'El correo o la contraseña son incorrectos', details?: unknown) {
    super(message, 401, details);
  }
}

export class AccountInactiveError extends DomainError {
  public readonly code = 'AUTH_ACCOUNT_INACTIVE';

  constructor(
    message = 'Tu cuenta se encuentra inactiva. Contacta al administrador',
    details?: unknown,
  ) {
    super(message, 403, details);
  }
}

export class TokenExpiredError extends DomainError {
  public readonly code = 'AUTH_TOKEN_EXPIRED';

  constructor(message = 'Sesión expirada. Por favor inicia sesión nuevamente.', details?: unknown) {
    super(message, 401, details);
  }
}
