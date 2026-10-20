export const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'DEPOSIT', 'CHECK', 'CARD'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** What each method needs so the office can reconcile it (same rule as the API). */
export const METHODS_REQUIRING_REFERENCE: readonly PaymentMethod[] = [
  'TRANSFER',
  'DEPOSIT',
  'CHECK',
  'CARD',
];
export const METHODS_REQUIRING_BANK: readonly PaymentMethod[] = ['TRANSFER', 'DEPOSIT', 'CHECK'];

/** SINGLE: everything at once. WEEKLY: equal payments every 7 days. */
export const PAYMENT_PLAN_TYPES = ['SINGLE', 'WEEKLY'] as const;
export type PaymentPlanType = (typeof PAYMENT_PLAN_TYPES)[number];
export const MIN_WEEKLY_INSTALLMENTS = 2;
export const MAX_WEEKLY_INSTALLMENTS = 52;

export type ReceivableStatus = 'OPEN' | 'PAID' | 'CANCELLED';
export type ReceivableSource = 'ORDER' | 'BILLING';
export type InstallmentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface Installment {
  id: string;
  number: number;
  /** ISO instant. */
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentStatus;
}

/** How the customer pays an order (chosen when the order is taken). */
export interface PaymentPlanInput {
  type: PaymentPlanType;
  /** WEEKLY: number of payments. */
  installments?: number;
  /** ISO instant of the first (or only) payment; the server defaults it from the delivery. */
  firstDueDate?: string;
}

export interface PaymentPlan {
  type: PaymentPlanType;
  installments: number;
  firstDueDate: string | null;
}

export interface RegisterPaymentInput {
  receivableId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  bankName?: string;
  /** ISO instant: date written on the check. */
  checkDate?: string;
  /** Photo of the receipt or the check, taken on the device. */
  photoLocalUri?: string;
  notes?: string;
  visitId?: string;
}

export interface ReceivableFilter {
  customerId?: string;
  /** Only receivables with a balance to collect. */
  onlyOpen?: boolean;
}

export interface PaymentFilter {
  customerId?: string;
  visitId?: string;
  /** Inclusive range of `paidAt` (ISO instants). */
  from?: string;
  to?: string;
}

export interface CustomerBalance {
  balance: number;
  overdue: number;
  openReceivables: number;
}

/** Credit rules sent by the server in every pull (applied offline too). */
export interface CollectionsSettings {
  blockOrdersWhenOverdue: boolean;
  overdueGraceDays: number;
}

export const DEFAULT_COLLECTIONS_SETTINGS: CollectionsSettings = {
  blockOrdersWhenOverdue: true,
  overdueGraceDays: 0,
};
