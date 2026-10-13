import { DomainError } from './domain.error';

export class CustomerNotFoundError extends DomainError {
  public readonly code = 'CUSTOMER_NOT_FOUND';

  constructor(message = 'El cliente no existe en este dispositivo', details?: unknown) {
    super(message, 404, details);
  }
}

export class CustomerAlreadyActiveError extends DomainError {
  public readonly code = 'CUSTOMER_ALREADY_ACTIVE';

  constructor(message = 'El cliente ya tiene datos de facturación', details?: unknown) {
    super(message, 409, details);
  }
}

export class CustomerIdentificationTakenError extends DomainError {
  public readonly code = 'CUSTOMER_IDENTIFICATION_TAKEN';

  constructor(tradeName: string) {
    super(`Esta identificación ya pertenece al cliente ${tradeName}`, 409, { tradeName });
  }
}

export class CustomerLookupNotFoundError extends DomainError {
  public readonly code = 'CUSTOMER_LOOKUP_NOT_FOUND';

  constructor(
    message = 'No existe un cliente con esa identificación en el sistema de facturación',
    details?: unknown,
  ) {
    super(message, 404, details);
  }
}
