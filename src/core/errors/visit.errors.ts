import { DomainError } from './domain.error';

export class VisitNotFoundError extends DomainError {
  public readonly code = 'VISIT_NOT_FOUND';

  constructor(message = 'La visita no existe en este dispositivo', details?: unknown) {
    super(message, 404, details);
  }
}

export class VisitInvalidTransitionError extends DomainError {
  public readonly code = 'VISIT_INVALID_TRANSITION';

  constructor(from: string, to: string) {
    super(`La visita no puede pasar de ${from} a ${to}`, 409, { from, to });
  }
}

export class VisitOutcomeNotAllowedError extends DomainError {
  public readonly code = 'VISIT_OUTCOME_NOT_ALLOWED';

  constructor(type: string, outcome: string) {
    super(`El resultado ${outcome} no aplica a una visita de tipo ${type}`, 422, {
      type,
      outcome,
    });
  }
}

export class VisitStorePhotoRequiredError extends DomainError {
  public readonly code = 'VISIT_STORE_PHOTO_REQUIRED';

  constructor(
    message = 'Este local aún no tiene foto: toma la foto del local para cerrar la visita',
    details?: unknown,
  ) {
    super(message, 422, details);
  }
}

export class VisitAlreadyInProgressError extends DomainError {
  public readonly code = 'VISIT_ALREADY_IN_PROGRESS';

  constructor(activeVisitId: string) {
    super('Ya tienes una visita en curso: finalízala antes de iniciar otra', 409, {
      activeVisitId,
    });
  }
}

export class VisitCustomerNotInvoiceableError extends DomainError {
  public readonly code = 'VISIT_CUSTOMER_NOT_INVOICEABLE';

  constructor(
    message = 'El cliente aún es prospecto: completa sus datos de facturación primero',
    details?: unknown,
  ) {
    super(message, 422, details);
  }
}

export class VisitParentNotFoundError extends DomainError {
  public readonly code = 'VISIT_PARENT_NOT_FOUND';

  constructor(message = 'La visita de origen no existe o es de otro cliente', details?: unknown) {
    super(message, 404, details);
  }
}
