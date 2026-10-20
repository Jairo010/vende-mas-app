import { DomainError } from './domain.error';

export class CameraPermissionDeniedError extends DomainError {
  public readonly code = 'CAMERA_PERMISSION_DENIED';

  constructor(
    message = 'Sin permiso para usar la cámara. Actívalo en los ajustes del teléfono.',
    details?: unknown,
  ) {
    super(message, 403, details);
  }
}
