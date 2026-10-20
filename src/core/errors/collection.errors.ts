import { DomainError } from './domain.error';

export class ReceivableNotFoundError extends DomainError {
  public readonly code = 'RECEIVABLE_NOT_FOUND';

  constructor(message = 'La cuenta por cobrar no está en este dispositivo', details?: unknown) {
    super(message, 404, details);
  }
}

export class ReceivableNotOpenError extends DomainError {
  public readonly code = 'RECEIVABLE_NOT_OPEN';

  constructor(message = 'Este documento ya no tiene saldo por cobrar', details?: unknown) {
    super(message, 422, details);
  }
}

export class PaymentExceedsBalanceError extends DomainError {
  public readonly code = 'PAYMENT_EXCEEDS_BALANCE';

  constructor(balance: string) {
    super(`El pago supera el saldo pendiente (${balance})`, 422, { balance });
  }
}

export class InvalidPaymentError extends DomainError {
  public readonly code = 'INVALID_COLLECTION_PAYMENT';

  constructor(message: string, details?: unknown) {
    super(message, 422, details);
  }
}
