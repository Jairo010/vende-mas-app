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
  notes?: string;
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
  reason?: string;
}
