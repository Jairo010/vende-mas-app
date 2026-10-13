import type { PaymentMethod } from '../types/collection.types';
import type { LocalSyncStatus } from '../types/visit.types';
import type { InstallmentAllocation } from '../value-objects/payment-schedule';

export interface PaymentProps {
  id: string;
  receivableId: string;
  customerId: string;
  customerName: string | null;
  documentNumber: string | null;
  sellerId: string;
  visitId: string | null;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  bankName: string | null;
  checkDate: string | null;
  photoUrl: string | null;
  photoLocalUri: string | null;
  notes: string | null;
  paidAt: string;
  allocations: InstallmentAllocation[];
  syncStatus: LocalSyncStatus;
}

/** Money collected by the seller (cash, transfer, deposit, check or card). */
export class PaymentEntity {
  public readonly id: string;
  public readonly receivableId: string;
  public readonly customerId: string;
  public readonly customerName: string | null;
  public readonly documentNumber: string | null;
  public readonly sellerId: string;
  public readonly visitId: string | null;
  public readonly amount: number;
  public readonly method: PaymentMethod;
  public readonly reference: string | null;
  public readonly bankName: string | null;
  public readonly checkDate: string | null;
  public readonly photoUrl: string | null;
  public readonly photoLocalUri: string | null;
  public readonly notes: string | null;
  public readonly paidAt: string;
  public readonly allocations: InstallmentAllocation[];
  public readonly syncStatus: LocalSyncStatus;

  constructor(props: PaymentProps) {
    this.id = props.id;
    this.receivableId = props.receivableId;
    this.customerId = props.customerId;
    this.customerName = props.customerName;
    this.documentNumber = props.documentNumber;
    this.sellerId = props.sellerId;
    this.visitId = props.visitId;
    this.amount = props.amount;
    this.method = props.method;
    this.reference = props.reference;
    this.bankName = props.bankName;
    this.checkDate = props.checkDate;
    this.photoUrl = props.photoUrl;
    this.photoLocalUri = props.photoLocalUri;
    this.notes = props.notes;
    this.paidAt = props.paidAt;
    this.allocations = props.allocations;
    this.syncStatus = props.syncStatus;
  }

  public static create(props: PaymentProps): PaymentEntity {
    return new PaymentEntity(props);
  }
}
