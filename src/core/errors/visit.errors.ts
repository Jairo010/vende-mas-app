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
