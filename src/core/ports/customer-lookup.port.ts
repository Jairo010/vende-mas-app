import type { CustomerEntity } from '../entities/customer.entity';

export interface CustomerLookupResult {
  customer: CustomerEntity;
  /** LOCAL: already in the system. BILLING: just imported from the billing system. */
  source: 'LOCAL' | 'BILLING';
}

/** Online search by identification in the API, which falls back to the billing system. */
export interface ICustomerLookupPort {
  /** Throws `CustomerLookupNotFoundError` when nobody has that identification. */
  lookupByIdentification(identification: string): Promise<CustomerLookupResult>;
}
