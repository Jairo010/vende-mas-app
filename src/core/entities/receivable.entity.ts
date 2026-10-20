import type {
  Installment,
  PaymentPlanType,
  ReceivableSource,
  ReceivableStatus,
} from '../types/collection.types';
import type { LocalSyncStatus } from '../types/visit.types';
import { fromCents, overdueAmountOf, toCents } from '../value-objects/payment-schedule';

export interface ReceivableProps {
  id: string;
  customerId: string;
  customerName: string | null;
  sellerId: string | null;
  orderId: string | null;
  source: ReceivableSource;
  /** Order or invoice number shown to the customer. */
  documentNumber: string;
  planType: PaymentPlanType;
  issuedAt: string;
  total: number;
  paidAmount: number;
  externalPaidAmount: number;
  status: ReceivableStatus;
  installments: Installment[];
  syncStatus: LocalSyncStatus;
  updatedAt: string;
}

/** What a customer owes for one document, in installments (mirrors the API). */
export class ReceivableEntity {
  public readonly id: string;
  public readonly customerId: string;
  public readonly customerName: string | null;
  public readonly sellerId: string | null;
  public readonly orderId: string | null;
  public readonly source: ReceivableSource;
  public readonly documentNumber: string;
  public readonly planType: PaymentPlanType;
  public readonly issuedAt: string;
  public readonly total: number;
  public readonly paidAmount: number;
  public readonly externalPaidAmount: number;
  public readonly status: ReceivableStatus;
  public readonly installments: Installment[];
  public readonly syncStatus: LocalSyncStatus;
  public readonly updatedAt: string;

  constructor(props: ReceivableProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.customerName = props.customerName;
    this.sellerId = props.sellerId;
    this.orderId = props.orderId;
    this.source = props.source;
    this.documentNumber = props.documentNumber;
    this.planType = props.planType;
    this.issuedAt = props.issuedAt;
    this.total = props.total;
    this.paidAmount = props.paidAmount;
    this.externalPaidAmount = props.externalPaidAmount;
    this.status = props.status;
    this.installments = [...props.installments].sort((a, b) => a.number - b.number);
    this.syncStatus = props.syncStatus;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: ReceivableProps): ReceivableEntity {
    return new ReceivableEntity(props);
  }

  public get balance(): number {
    if (this.status === 'CANCELLED') return 0;
    return fromCents(
      Math.max(
        0,
        toCents(this.total) - toCents(this.paidAmount) - toCents(this.externalPaidAmount),
      ),
    );
  }

  public isOpen(): boolean {
    return this.status === 'OPEN' && toCents(this.balance) > 0;
  }

  public overdueAmount(asOf: Date = new Date(), graceDays = 0): number {
    return this.isOpen() ? overdueAmountOf(this.installments, asOf, graceDays) : 0;
  }

  /** The installment to collect next (the oldest with something left). */
  public nextInstallment(): Installment | null {
    return (
      this.installments.find(
        (installment) => toCents(installment.amount) > toCents(installment.paidAmount),
      ) ?? null
    );
  }

  /** Unpaid part of an installment. */
  public static remainingOf(installment: Installment): number {
    return fromCents(Math.max(0, toCents(installment.amount) - toCents(installment.paidAmount)));
  }
}
