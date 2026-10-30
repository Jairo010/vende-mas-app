import type { CustomerProduct } from '../types/customer-product.types';

/** What a customer usually buys, downloaded by the sync (read only on the device). */
export interface ICustomerProductRepositoryPort {
  /** Most bought first, then the most recent. */
  findByCustomer(customerId: string): Promise<CustomerProduct[]>;
}
