import type { CustomerEntity } from '../entities/customer.entity';
import type {
  CreateCustomerInput,
  CustomerFilter,
  PromoteCustomerInput,
  UpdateCustomerInput,
} from '../types/customer.types';
import type { ActorContext } from './visit.repository.port';

/** Local-first customer store (writes are queued in the outbox, like visits). */
export interface ICustomerRepositoryPort {
  search(filter?: CustomerFilter): Promise<CustomerEntity[]>;
  findById(id: string): Promise<CustomerEntity | null>;
  create(input: CreateCustomerInput, actor: ActorContext): Promise<CustomerEntity>;
  update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity>;
  /** PROSPECT → ACTIVE with billing data. */
  promote(id: string, input: PromoteCustomerInput): Promise<CustomerEntity>;
}
