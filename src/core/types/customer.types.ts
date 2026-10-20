export const CUSTOMER_STATUSES = ['PROSPECT', 'ACTIVE'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const IDENTIFICATION_TYPES = ['RUC', 'CEDULA', 'PASSPORT'] as const;
export type IdentificationType = (typeof IDENTIFICATION_TYPES)[number];

export type BillingSyncStatus = 'NOT_REQUIRED' | 'PENDING' | 'EXPORTED' | 'FAILED';

export interface CustomerFilter {
  /** Matches trade name, business name or identification. */
  search?: string;
  status?: CustomerStatus;
  limit?: number;
}

export interface CreateCustomerInput {
  status?: CustomerStatus;
  /** Trade name, or a reference when the owner shares no data (the only required field). */
  tradeName: string;
  businessName?: string;
  identificationType?: IdentificationType;
  identification?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  addressReference?: string;
  latitude?: number;
  longitude?: number;
  /** Store photo taken on the device; uploaded before the push. */
  storePhotoLocalUri?: string;
}

export interface UpdateCustomerInput {
  tradeName?: string;
  businessName?: string | null;
  identificationType?: IdentificationType | null;
  identification?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  addressReference?: string | null;
  latitude?: number;
  longitude?: number;
  storePhotoLocalUri?: string;
}

/** Billing data required to turn a prospect into an ACTIVE customer. */
export interface PromoteCustomerInput {
  businessName: string;
  identificationType: IdentificationType;
  identification: string;
  address: string;
  email: string;
  phone?: string;
  contactName?: string;
}
