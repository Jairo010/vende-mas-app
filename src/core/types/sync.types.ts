export const SYNC_ENTITY_TYPES = ['CUSTOMER', 'VISIT', 'ORDER'] as const;
export type SyncEntityType = (typeof SYNC_ENTITY_TYPES)[number];

export type SyncAction =
  'CREATE' | 'UPDATE' | 'PROMOTE' | 'SCHEDULE' | 'START' | 'COMPLETE' | 'RESCHEDULE' | 'CANCEL';

/** Server verdict for each pushed operation (see docs/sync-protocol.md in the API). */
export type SyncResultStatus = 'APPLIED' | 'DUPLICATE' | 'REJECTED' | 'RETRY' | 'SKIPPED';

/** PENDING: waiting to be sent. REJECTED: refused by the server, kept to show the error. */
export type OutboxStatus = 'PENDING' | 'REJECTED';

export interface SyncError {
  code: string;
  message: string;
}

/** A local mutation waiting in the outbox. */
export interface OutboxOperation {
  seq: number;
  idempotencyKey: string;
  entityType: SyncEntityType;
  entityId: string;
  action: SyncAction;
  payload: Record<string, unknown>;
  clientTimestamp: string;
  /** Pending photo whose server URL must be written into `payload[photoField]`. */
  photoId: string | null;
  photoField: string | null;
  status: OutboxStatus;
  attempts: number;
  lastError: SyncError | null;
  createdAt: string;
}

/** A mutation to enqueue (the outbox assigns `seq`, status and timestamps). */
export interface NewOutboxOperation {
  idempotencyKey: string;
  entityType: SyncEntityType;
  entityId: string;
  action: SyncAction;
  payload: Record<string, unknown>;
  clientTimestamp: string;
  photoId?: string;
  photoField?: string;
}

/** Operation as sent to `POST /sync/push`. */
export interface SyncPushOperation {
  idempotencyKey: string;
  entityType: SyncEntityType;
  entityId: string;
  action: SyncAction;
  clientTimestamp: string;
  payload: Record<string, unknown>;
}

export interface SyncPushResult {
  idempotencyKey: string;
  entityType: SyncEntityType;
  entityId: string;
  action: SyncAction;
  status: SyncResultStatus;
  data?: unknown;
  error?: SyncError;
}

export interface PendingPhoto {
  id: string;
  localUri: string;
  remoteUrl: string | null;
  attempts: number;
}

export interface SyncRunSummary {
  /** Operations the server accepted (APPLIED / DUPLICATE). */
  pushed: number;
  rejected: number;
  /** Operations kept for a later run (RETRY / SKIPPED / not reached). */
  pending: number;
  pulled: boolean;
  /** Set when the run stopped early (offline, server down). */
  error: string | null;
}
