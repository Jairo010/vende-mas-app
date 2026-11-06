import {
  VisitCustomerNotInvoiceableError,
  VisitFailureReasonRequiredError,
  VisitInvalidFailureReasonError,
  VisitInvalidTransitionError,
  VisitNotesRequiredError,
  VisitOutcomeNotAllowedError,
} from '../errors/visit.errors';
import {
  CANCELLATION_FAILURE_REASONS,
  FAILURE_REASONS_BY_OUTCOME,
  hasValidVisitNotes,
  MIN_VISIT_NOTES_LENGTH,
  OUTCOMES_BY_TYPE,
  OUTCOMES_REQUIRING_ACTIVE_CUSTOMER,
  type LocalSyncStatus,
  type VisitCheckpoint,
  type VisitFailureReason,
  type VisitOutcome,
  type VisitStatus,
  type VisitType,
} from '../types/visit.types';

/** What the agenda needs to show about the visited customer or prospect. */
export interface VisitCustomerSummary {
  id: string;
  tradeName: string;
  status: 'PROSPECT' | 'ACTIVE';
  contactName: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  storePhotoUrl: string | null;
}

export interface VisitProps {
  id: string;
  type: VisitType;
  status: VisitStatus;
  outcome: VisitOutcome | null;
  scheduledAt: string;
  /** false = planned for the local day of `scheduledAt` only (no agreed time). */
  hasScheduledTime: boolean;
  notes: string | null;
  start: VisitCheckpoint | null;
  end: VisitCheckpoint | null;
  distanceToCustomerMeters: number | null;
  durationMinutes: number | null;
  photoUrl: string | null;
  photoLocalUri: string | null;
  cancellationReason: string | null;
  /** Why it failed; null if it did not fail or was closed before reasons existed. */
  failureReason?: VisitFailureReason | null;
  sellerId: string;
  sellerName: string | null;
  createdById: string;
  customerId: string;
  parentVisitId: string | null;
  customer: VisitCustomerSummary | null;
  syncStatus: LocalSyncStatus;
  createdAt: string;
  updatedAt: string;
}

const assertAllowedReason = (
  reason: VisitFailureReason | null | undefined,
  allowed: readonly VisitFailureReason[],
): void => {
  if (!reason) throw new VisitFailureReasonRequiredError(allowed);
  if (!allowed.includes(reason)) throw new VisitInvalidFailureReasonError(reason, allowed);
};

const assertNotes = (notes: string | null | undefined): void => {
  if (!hasValidVisitNotes(notes)) throw new VisitNotesRequiredError(MIN_VISIT_NOTES_LENGTH);
};

/**
 * Unit of work of a seller (ADR 0016 in the API). Holds the same state machine as the
 * server, so offline actions are validated before they are queued:
 * SCHEDULED → IN_PROGRESS → COMPLETED, and SCHEDULED → CANCELLED.
 */
export class VisitEntity {
  public readonly id: string;
  public readonly type: VisitType;
  public readonly status: VisitStatus;
  public readonly outcome: VisitOutcome | null;
  public readonly scheduledAt: string;
  public readonly hasScheduledTime: boolean;
  public readonly notes: string | null;
  public readonly start: VisitCheckpoint | null;
  public readonly end: VisitCheckpoint | null;
  public readonly distanceToCustomerMeters: number | null;
  public readonly durationMinutes: number | null;
  public readonly photoUrl: string | null;
  public readonly photoLocalUri: string | null;
  public readonly cancellationReason: string | null;
  public readonly failureReason: VisitFailureReason | null;
  public readonly sellerId: string;
  public readonly sellerName: string | null;
  public readonly createdById: string;
  public readonly customerId: string;
  public readonly parentVisitId: string | null;
  public readonly customer: VisitCustomerSummary | null;
  public readonly syncStatus: LocalSyncStatus;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  constructor(props: VisitProps) {
    this.id = props.id;
    this.type = props.type;
    this.status = props.status;
    this.outcome = props.outcome;
    this.scheduledAt = props.scheduledAt;
    this.hasScheduledTime = props.hasScheduledTime;
    this.notes = props.notes;
    this.start = props.start;
    this.end = props.end;
    this.distanceToCustomerMeters = props.distanceToCustomerMeters;
    this.durationMinutes = props.durationMinutes;
    this.photoUrl = props.photoUrl;
    this.photoLocalUri = props.photoLocalUri;
    this.cancellationReason = props.cancellationReason;
    this.failureReason = props.failureReason ?? null;
    this.sellerId = props.sellerId;
    this.sellerName = props.sellerName;
    this.createdById = props.createdById;
    this.customerId = props.customerId;
    this.parentVisitId = props.parentVisitId;
    this.customer = props.customer;
    this.syncStatus = props.syncStatus;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: VisitProps): VisitEntity {
    return new VisitEntity(props);
  }

  public canStart(): boolean {
    return this.status === 'SCHEDULED';
  }

  public canComplete(): boolean {
    return this.status === 'IN_PROGRESS';
  }

  /** Same rule as the API. A visit in progress is closed with its outcome and reason instead. */
  public canCancel(): boolean {
    return this.status === 'SCHEDULED';
  }

  public canReschedule(): boolean {
    return this.status === 'SCHEDULED';
  }

  public isClosed(): boolean {
    return this.status === 'COMPLETED' || this.status === 'CANCELLED';
  }

  public allowedOutcomes(): readonly VisitOutcome[] {
    return OUTCOMES_BY_TYPE[this.type];
  }

  /** Only the assigned seller checks in and out (supervisors follow it up). */
  public isAssignedTo(userId: string | null | undefined): boolean {
    return Boolean(userId) && this.sellerId === userId;
  }

  /** Opportunity visits must leave the store with a photo when the customer has none. */
  public needsStorePhoto(customerHasPhoto: boolean): boolean {
    return this.type === 'OPPORTUNITY' && !customerHasPhoto;
  }

  /** The outcome needs an ACTIVE (invoiceable) customer, e.g. closing a sale. */
  public static outcomeRequiresActiveCustomer(outcome: VisitOutcome): boolean {
    return OUTCOMES_REQUIRING_ACTIVE_CUSTOMER.includes(outcome);
  }

  public assertCanStart(): void {
    if (!this.canStart()) throw new VisitInvalidTransitionError(this.status, 'IN_PROGRESS');
  }

  /** `customerIsActive` enables the "sale needs billing data" rule (omit to skip it). */
  public assertCanComplete(outcome: VisitOutcome, customerIsActive?: boolean): void {
    if (!this.canComplete()) throw new VisitInvalidTransitionError(this.status, 'COMPLETED');
    if (!this.allowedOutcomes().includes(outcome)) {
      throw new VisitOutcomeNotAllowedError(this.type, outcome);
    }
    if (customerIsActive === false && VisitEntity.outcomeRequiresActiveCustomer(outcome)) {
      throw new VisitCustomerNotInvoiceableError();
    }
  }

  /** Reasons the outcome asks for; null when it did not fail and takes none. */
  public static failureReasonsFor(outcome: VisitOutcome): readonly VisitFailureReason[] | null {
    return FAILURE_REASONS_BY_OUTCOME[outcome] ?? null;
  }

  /** Notes are always required; the reason only on outcomes that achieved nothing. */
  public static assertCompletionDetails(
    outcome: VisitOutcome,
    notes: string | null | undefined,
    failureReason: VisitFailureReason | null | undefined,
  ): void {
    const reasons = VisitEntity.failureReasonsFor(outcome);
    if (!reasons && failureReason) throw new VisitInvalidFailureReasonError(failureReason, []);
    if (reasons) assertAllowedReason(failureReason, reasons);
    assertNotes(notes);
  }

  public assertCanCancel(): void {
    if (!this.canCancel()) throw new VisitInvalidTransitionError(this.status, 'CANCELLED');
  }

  public static assertCancellationDetails(
    failureReason: VisitFailureReason | null | undefined,
    notes: string | null | undefined,
  ): void {
    assertAllowedReason(failureReason, CANCELLATION_FAILURE_REASONS);
    assertNotes(notes);
  }

  public assertCanReschedule(): void {
    if (!this.canReschedule()) throw new VisitInvalidTransitionError(this.status, 'SCHEDULED');
  }

  /** Minutes elapsed since check-in (for the "visit in progress" banner). */
  public elapsedMinutes(now: Date = new Date()): number | null {
    if (!this.start) return null;
    const until = this.end ? new Date(this.end.at) : now;
    return Math.max(0, Math.round((until.getTime() - new Date(this.start.at).getTime()) / 60_000));
  }
}
