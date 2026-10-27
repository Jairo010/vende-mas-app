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

export class CompanySuspendedError extends DomainError {
  public readonly code = 'COMPANY_SUSPENDED';

  constructor(
    message = 'La cuenta de tu empresa está suspendida. Comunícate con tu administrador',
    details?: unknown,
  ) {
    super(message, 403, details);
  }
}

/** Platform staff (no company) manage Vende Más from the web, not from the field app. */
export class WebOnlyAccountError extends DomainError {
  public readonly code = 'AUTH_WEB_ONLY_ACCOUNT';

  constructor(
    message = 'Esta cuenta es de la plataforma: ingresa desde la web de Vende Más',
    details?: unknown,
  ) {
    super(message, 403, details);
  }
}
