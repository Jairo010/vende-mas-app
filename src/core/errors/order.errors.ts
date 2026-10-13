import { DomainError } from './domain.error';

export class OrderNotFoundError extends DomainError {
  public readonly code = 'ORDER_NOT_FOUND';

  constructor(message = 'El pedido no existe en este dispositivo', details?: unknown) {
    super(message, 404, details);
  }
}

export class OrderCustomerNotActiveError extends DomainError {
  public readonly code = 'ORDER_CUSTOMER_NOT_ACTIVE';

  constructor(
    message = 'Solo se pueden tomar pedidos a clientes con datos de facturación',
    details?: unknown,
  ) {
    super(message, 422, details);
  }
}

export class OrderEmptyError extends DomainError {
  public readonly code = 'ORDER_EMPTY';

  constructor(message = 'El pedido debe tener al menos un producto', details?: unknown) {
    super(message, 422, details);
  }
}

export class OrderCustomerOverdueError extends DomainError {
  public readonly code = 'ORDER_CUSTOMER_HAS_OVERDUE_BALANCE';

  constructor(overdue: string) {
    super(`El cliente tiene ${overdue} vencido: cóbralo antes de tomar un pedido nuevo`, 422, {
      overdue,
    });
  }
}

export class OrderProductUnavailableError extends DomainError {
  public readonly code = 'ORDER_PRODUCT_UNAVAILABLE';

  constructor(productId: string) {
    super('Uno de los productos ya no está disponible en el catálogo', 422, { productId });
  }
}
