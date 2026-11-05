import type { GeoPoint } from './geo.types';

export const VISIT_TYPES = ['OPPORTUNITY', 'ORDER', 'COLLECTION'] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const VISIT_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const VISIT_OUTCOMES = [
  'INTERESTED',
  'NOT_INTERESTED',
  'FOLLOW_UP',
  'SALE_CLOSED',
  'ORDER_TAKEN',
  'NO_ORDER',
  'COLLECTED',
  'PARTIALLY_COLLECTED',
  'NOT_COLLECTED',
] as const;
export type VisitOutcome = (typeof VISIT_OUTCOMES)[number];

/** Outcomes that make sense for each kind of visit (same rule as the API). */
export const OUTCOMES_BY_TYPE: Readonly<Record<VisitType, readonly VisitOutcome[]>> = {
  OPPORTUNITY: ['INTERESTED', 'NOT_INTERESTED', 'FOLLOW_UP', 'SALE_CLOSED'],
  ORDER: ['ORDER_TAKEN', 'NO_ORDER'],
  COLLECTION: ['COLLECTED', 'PARTIALLY_COLLECTED', 'NOT_COLLECTED'],
};

/** Why a visit failed: a fixed list, the same for every company (API ADR 0036). */
const ATTENTION_REASONS = ['STORE_CLOSED', 'CONTACT_UNAVAILABLE', 'WRONG_ADDRESS'] as const;
const SALES_REASONS = [
  'HAS_STOCK',
  'NO_BUDGET',
  'PRICE_TOO_HIGH',
  'BUYS_FROM_COMPETITOR',
  'PRODUCT_UNAVAILABLE',
  'NOT_INTERESTED',
] as const;
const COLLECTION_REASONS = [
  'PROMISED_LATER',
  'NO_FUNDS',
  'INVOICE_DISPUTED',
  'ALREADY_PAID',
] as const;
const CANCELLATION_REASONS = ['NO_TIME_ON_ROUTE', 'CUSTOMER_ASKED_OTHER_DATE'] as const;

export const VISIT_FAILURE_REASONS = [
  ...ATTENTION_REASONS,
  ...SALES_REASONS,
  ...COLLECTION_REASONS,
  ...CANCELLATION_REASONS,
  'OTHER',
] as const;
export type VisitFailureReason = (typeof VISIT_FAILURE_REASONS)[number];

/** Outcomes that say the visit achieved nothing: the seller must tell why (same rule as the API). */
export const FAILURE_REASONS_BY_OUTCOME: Readonly<
  Partial<Record<VisitOutcome, readonly VisitFailureReason[]>>
> = {
  NOT_INTERESTED: [...ATTENTION_REASONS, ...SALES_REASONS, 'OTHER'],
  NO_ORDER: [...ATTENTION_REASONS, ...SALES_REASONS, 'OTHER'],
  NOT_COLLECTED: [...ATTENTION_REASONS, ...COLLECTION_REASONS, 'OTHER'],
};

export const CANCELLATION_FAILURE_REASONS: readonly VisitFailureReason[] = [
  ...ATTENTION_REASONS,
  ...CANCELLATION_REASONS,
  'OTHER',
];

/** Fewest characters (without surrounding spaces) that count as notes when closing a visit. */
export const MIN_VISIT_NOTES_LENGTH = 5;

export function hasValidVisitNotes(notes: string | null | undefined): boolean {
  return (notes?.trim().length ?? 0) >= MIN_VISIT_NOTES_LENGTH;
}

/** Only invoiceable (ACTIVE) customers can receive order or collection visits (API rule). */
export const VISIT_TYPES_REQUIRING_ACTIVE_CUSTOMER: readonly VisitType[] = ['ORDER', 'COLLECTION'];

/** Closing a sale needs billing data: the prospect must be promoted first (API rule). */
export const OUTCOMES_REQUIRING_ACTIVE_CUSTOMER: readonly VisitOutcome[] = ['SALE_CLOSED'];

/** Local replication state of an entity (see the outbox). */
export type LocalSyncStatus = 'SYNCED' | 'PENDING' | 'REJECTED';

export interface VisitCheckpoint {
  /** ISO instant. */
  at: string;
  location: GeoPoint | null;
}

export interface VisitFilter {
  /** Inclusive range of `scheduledAt` (ISO instants). */
  from: string;
  to: string;
  statuses?: VisitStatus[];
  customerId?: string;
}

export interface ScheduleVisitInput {
  type: VisitType;
  customerId: string;
  /** ISO instant; the local midnight of the day when there is no agreed time. */
  scheduledAt: string;
  /** false = planned for the day only. Defaults to true. */
  hasScheduledTime?: boolean;
  notes?: string;
  /** SUPERVISOR / ADMIN: seller who performs the visit. Defaults to the current user. */
  sellerId?: string;
  parentVisitId?: string;
}

export interface StartVisitInput {
  location?: GeoPoint;
}

export interface CompleteVisitInput {
  outcome: VisitOutcome;
  location?: GeoPoint;
  /** Always required, whatever the outcome. */
  notes: string;
  /** Required for the outcomes in `FAILURE_REASONS_BY_OUTCOME`, refused for any other. */
  failureReason?: VisitFailureReason;
  /** Photo taken on the device (store front); uploaded before the push. */
  photoLocalUri?: string;
}

export interface RescheduleVisitInput {
  /** ISO instant; the local midnight of the day when there is no agreed time. */
  scheduledAt: string;
  /** false = moved to a day without an agreed time. Defaults to true. */
  hasScheduledTime?: boolean;
  notes?: string;
}

export interface CancelVisitInput {
  failureReason: VisitFailureReason;
  /** The notes of the cancellation: what happened, in words. */
  reason: string;
}
