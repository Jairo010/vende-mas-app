import type { PaymentEntity } from '../entities/payment.entity';
import type { ReceivableEntity } from '../entities/receivable.entity';
import type {
  CollectionsSettings,
  CustomerBalance,
  PaymentFilter,
  ReceivableFilter,
  RegisterPaymentInput,
} from '../types/collection.types';
import type { ActorContext } from './visit.repository.port';

/**
 * Local-first collections: receivables come from the sync (and from orders taken offline),
 * payments are applied locally and queued in the outbox like every other write.
 */
export interface ICollectionRepositoryPort {
  /** Oldest documents first. */
  findReceivables(filter?: ReceivableFilter): Promise<ReceivableEntity[]>;
  findReceivableById(id: string): Promise<ReceivableEntity | null>;
  /** Newest first. */
  findPayments(filter?: PaymentFilter): Promise<PaymentEntity[]>;
  findPaymentById(id: string): Promise<PaymentEntity | null>;
  getCustomerBalance(customerId: string, asOf?: Date): Promise<CustomerBalance>;
  /** Applies the payment to the installments (oldest first) and queues PAYMENT CREATE. */
  registerPayment(input: RegisterPaymentInput, actor: ActorContext): Promise<PaymentEntity>;
  getSettings(): Promise<CollectionsSettings>;
}
