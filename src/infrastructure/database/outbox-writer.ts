import { eq } from 'drizzle-orm';
import type { LocalSyncStatus } from '@/core/types/visit.types';
import type { NewOutboxOperation, SyncEntityType } from '@/core/types/sync.types';
import type { AppDatabase } from './database.types';
import { customers, orders, outbox, pendingPhotos, visits } from './schema';

/** The database or an open transaction (both expose the same synchronous query API). */
export type DbExecutor = Pick<AppDatabase, 'select' | 'insert' | 'update' | 'delete'>;

/** Actions that can happen only once per entity: their key is deterministic. */
const ONE_SHOT_ACTIONS = new Set(['CREATE', 'SCHEDULE', 'START', 'COMPLETE', 'CANCEL', 'PROMOTE']);

/**
 * Idempotency key of a queued operation, e.g. `visit-start-<visitId>`. Repeatable
 * actions (UPDATE, RESCHEDULE) get a unique suffix. The key never changes across retries.
 */
export function buildIdempotencyKey(
  entityType: SyncEntityType,
  action: string,
  entityId: string,
  uniqueSuffix: string,
): string {
  const base = `${entityType.toLowerCase()}-${action.toLowerCase()}-${entityId}`;
  return ONE_SHOT_ACTIONS.has(action) ? base : `${base}-${uniqueSuffix}`;
}

/** Drops `undefined` keys: sync payloads are validated strictly by the API. */
export function compactPayload<T extends object>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}

/** Queues a mutation. Call it in the same transaction that changes the local row. */
export function enqueueOperation(db: DbExecutor, operation: NewOutboxOperation, now: string): void {
  db.insert(outbox)
    .values({
      idempotencyKey: operation.idempotencyKey,
      entityType: operation.entityType,
      entityId: operation.entityId,
      action: operation.action,
      payload: operation.payload,
      clientTimestamp: operation.clientTimestamp,
      photoId: operation.photoId ?? null,
      photoField: operation.photoField ?? null,
      status: 'PENDING',
      createdAt: now,
    })
    .run();
}

/** Registers a photo taken offline so the sync uploads it before the push. */
export function registerPendingPhoto(
  db: DbExecutor,
  photoId: string,
  localUri: string,
  now: string,
): void {
  db.insert(pendingPhotos)
    .values({ id: photoId, localUri, createdAt: now })
    .onConflictDoNothing()
    .run();
}

/** Recomputes an entity's `sync_status` from what is left in the outbox for it. */
export function refreshEntitySyncStatus(
  db: DbExecutor,
  entityType: SyncEntityType,
  entityId: string,
): LocalSyncStatus {
  const rows = db
    .select({ status: outbox.status })
    .from(outbox)
    .where(eq(outbox.entityId, entityId))
    .all();

  const status: LocalSyncStatus = rows.some((row) => row.status === 'REJECTED')
    ? 'REJECTED'
    : rows.length > 0
      ? 'PENDING'
      : 'SYNCED';

  setEntitySyncStatus(db, entityType, entityId, status);
  return status;
}

export function setEntitySyncStatus(
  db: DbExecutor,
  entityType: SyncEntityType,
  entityId: string,
  status: LocalSyncStatus,
): void {
  switch (entityType) {
    case 'CUSTOMER':
      db.update(customers).set({ syncStatus: status }).where(eq(customers.id, entityId)).run();
      break;
    case 'VISIT':
      db.update(visits).set({ syncStatus: status }).where(eq(visits.id, entityId)).run();
      break;
    case 'ORDER':
      db.update(orders).set({ syncStatus: status }).where(eq(orders.id, entityId)).run();
      break;
  }
}

/** Ids with operations still waiting to be sent: pulled server rows must not overwrite them. */
export function findEntityIdsWithPendingChanges(db: DbExecutor): Set<string> {
  const rows = db
    .select({ entityId: outbox.entityId })
    .from(outbox)
    .where(eq(outbox.status, 'PENDING'))
    .all();
  return new Set(rows.map((row) => row.entityId));
}
