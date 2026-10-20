import type { LocalSyncStatus } from '../types/visit.types';
import type {
  BillingSyncStatus,
  CustomerStatus,
  IdentificationType,
} from '../types/customer.types';

export interface CustomerProps {
  id: string;
  status: CustomerStatus;
  tradeName: string;
  businessName: string | null;
  identificationType: IdentificationType | null;
  identification: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  addressReference: string | null;
  latitude: number | null;
  longitude: number | null;
  storePhotoUrl: string | null;
  storePhotoLocalUri: string | null;
  assignedSellerId: string | null;
  createdById: string | null;
  externalId: string | null;
  billingSyncStatus: BillingSyncStatus;
  isActive: boolean;
  syncStatus: LocalSyncStatus;
  createdAt: string;
  updatedAt: string;
}

/** Customer or prospect. A PROSPECT may only have a trade name (or a reference). */
export class CustomerEntity {
  public readonly id: string;
  public readonly status: CustomerStatus;
  public readonly tradeName: string;
  public readonly businessName: string | null;
  public readonly identificationType: IdentificationType | null;
  public readonly identification: string | null;
  public readonly contactName: string | null;
  public readonly phone: string | null;
  public readonly email: string | null;
  public readonly address: string | null;
  public readonly addressReference: string | null;
  public readonly latitude: number | null;
  public readonly longitude: number | null;
  public readonly storePhotoUrl: string | null;
  public readonly storePhotoLocalUri: string | null;
  public readonly assignedSellerId: string | null;
  public readonly createdById: string | null;
  public readonly externalId: string | null;
  public readonly billingSyncStatus: BillingSyncStatus;
  public readonly isActive: boolean;
  public readonly syncStatus: LocalSyncStatus;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  constructor(props: CustomerProps) {
    this.id = props.id;
    this.status = props.status;
    this.tradeName = props.tradeName;
    this.businessName = props.businessName;
    this.identificationType = props.identificationType;
    this.identification = props.identification;
    this.contactName = props.contactName;
    this.phone = props.phone;
    this.email = props.email;
    this.address = props.address;
    this.addressReference = props.addressReference;
    this.latitude = props.latitude;
    this.longitude = props.longitude;
    this.storePhotoUrl = props.storePhotoUrl;
    this.storePhotoLocalUri = props.storePhotoLocalUri;
    this.assignedSellerId = props.assignedSellerId;
    this.createdById = props.createdById;
    this.externalId = props.externalId;
    this.billingSyncStatus = props.billingSyncStatus;
    this.isActive = props.isActive;
    this.syncStatus = props.syncStatus;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: CustomerProps): CustomerEntity {
    return new CustomerEntity(props);
  }

  public isProspect(): boolean {
    return this.status === 'PROSPECT';
  }

  /** Orders are only accepted for ACTIVE customers (they have billing data). */
  public canTakeOrders(): boolean {
    return this.status === 'ACTIVE' && this.isActive;
  }

  /** The store photo is mandatory on the first opportunity visit. */
  public hasStorePhoto(): boolean {
    return Boolean(this.storePhotoUrl || this.storePhotoLocalUri);
  }

  public hasLocation(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }
}
