/** Wire format of the API collections module (`/api/v1/collections`, also used by sync). */

export interface ReceivableInstallmentDto {
  id: string;
  number: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
}

export interface ReceivableResponseDto {
  id: string;
  customerId: string;
  sellerId: string | null;
  orderId: string | null;
  source: string;
  documentNumber: string;
  externalId: string | null;
  planType: string;
  issuedAt: string;
  total: number;
  paidAmount: number;
  externalPaidAmount: number;
  balance: number;
  status: string;
  installments: ReceivableInstallmentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocationDto {
  installmentId: string;
  installmentNumber: number;
  amount: number;
  /** What the installment owed before (API ADR 0044); absent on older servers / payments. */
  balanceBefore?: number | null;
}

/** Balances before / after the payment (API ADR 0044). */
export interface PaymentBalancesDto {
  receivableBefore: number;
  receivableAfter: number;
  customerBefore?: number | null;
  customerAfter?: number | null;
}

export interface CollectionPaymentResponseDto {
  id: string;
  receivableId: string;
  customerId: string;
  sellerId: string;
  visitId: string | null;
  amount: number;
  method: string;
  reference: string | null;
  bankName: string | null;
  checkDate: string | null;
  photoUrl: string | null;
  notes: string | null;
  paidAt: string;
  billingSyncStatus: string;
  externalId: string | null;
  allocations: PaymentAllocationDto[];
  balances?: PaymentBalancesDto | null;
  createdAt: string;
  updatedAt: string;
}

/** `POST /collections/payments` (sync: PAYMENT CREATE). */
export interface RegisterPaymentRequestDto {
  id: string;
  receivableId: string;
  amount: number;
  method: string;
  reference?: string;
  bankName?: string;
  checkDate?: string;
  photoUrl?: string;
  notes?: string;
  visitId?: string;
  paidAt?: string;
}

export interface SyncSettingsDto {
  blockOrdersWhenOverdue: boolean;
  overdueGraceDays: number;
  /** Absent on servers before manual invoicing (ADR 0028 in the API). */
  receivableOpensOn?: 'ORDER' | 'INVOICE';
}
