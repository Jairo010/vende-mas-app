/** Wire format of the API customers module (`/api/v1/customers`, also used by sync). */

export interface CustomerResponseDto {
  id: string;
  status: string;
  tradeName: string;
  businessName: string | null;
  identificationType: string | null;
  identification: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  addressReference: string | null;
  latitude: number | null;
  longitude: number | null;
  storePhotoUrl: string | null;
  storePhotoUpdatedAt: string | null;
  assignedSellerId: string | null;
  createdById: string | null;
  externalId: string | null;
  billingSyncStatus: string;
  source: string;
  isActive: boolean;
  /** Set when the customer was deleted: remove it locally. */
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `POST /customers` (sync: CUSTOMER CREATE). */
export interface CreateCustomerRequestDto {
  id: string;
  status?: string;
  tradeName: string;
  businessName?: string;
  identificationType?: string;
  identification?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  addressReference?: string;
  latitude?: number;
  longitude?: number;
  storePhotoUrl?: string;
}

/** `PATCH /customers/:id` (sync: CUSTOMER UPDATE). */
export interface UpdateCustomerRequestDto {
  tradeName?: string;
  businessName?: string | null;
  identificationType?: string | null;
  identification?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  addressReference?: string | null;
  latitude?: number;
  longitude?: number;
  storePhotoUrl?: string;
}

/** `POST /customers/:id/promote` (sync: CUSTOMER PROMOTE). */
export interface PromoteCustomerRequestDto {
  businessName: string;
  identificationType: string;
  identification: string;
  address: string;
  email: string;
  phone?: string;
  contactName?: string;
}
