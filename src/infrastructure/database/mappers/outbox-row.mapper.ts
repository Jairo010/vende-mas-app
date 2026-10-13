import type {
  OutboxOperation,
  OutboxStatus,
  SyncAction,
  SyncEntityType,
} from '@/core/types/sync.types';
import type { outbox } from '../schema';

export type OutboxRow = typeof outbox.$inferSelect;

export class OutboxRowMapper {
  static toDomain(row: OutboxRow): OutboxOperation {
    return {
      seq: row.seq,
      idempotencyKey: row.idempotencyKey,
      entityType: row.entityType as SyncEntityType,
      entityId: row.entityId,
      action: row.action as SyncAction,
      payload: row.payload,
      clientTimestamp: row.clientTimestamp,
      photoId: row.photoId,
      photoField: row.photoField,
      status: row.status as OutboxStatus,
      attempts: row.attempts,
      lastError: row.lastErrorCode
        ? { code: row.lastErrorCode, message: row.lastErrorMessage ?? '' }
        : null,
      createdAt: row.createdAt,
    };
  }
}
