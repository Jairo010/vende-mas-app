import { asc, count, eq, sql } from 'drizzle-orm';
import { OrderMapper } from '@/application/mappers/order.mapper';
import type { IOutboxPort } from '@/core/ports/sync.ports';
import type { OutboxOperation, SyncEntityType, SyncError } from '@/core/types/sync.types';
import { OutboxRowMapper } from '../mappers/outbox-row.mapper';
import { refreshEntitySyncStatus } from '../outbox-writer';
import { orders, outbox } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

export class SqliteOutboxRepository implements IOutboxPort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async listPending(limit: number): Promise<OutboxOperation[]> {
    return this.ctx
      .db()
      .select()
      .from(outbox)
      .where(eq(outbox.status, 'PENDING'))
      .orderBy(asc(outbox.seq))
      .limit(limit)
      .all()
      .map(OutboxRowMapper.toDomain);
  }

  public async listRejected(): Promise<OutboxOperation[]> {
    return this.ctx
      .db()
      .select()
      .from(outbox)
      .where(eq(outbox.status, 'REJECTED'))
      .orderBy(asc(outbox.seq))
      .all()
      .map(OutboxRowMapper.toDomain);
  }

  public async countPending(): Promise<number> {
    const row = this.ctx
      .db()
      .select({ value: count() })
      .from(outbox)
      .where(eq(outbox.status, 'PENDING'))
      .get();
    return row?.value ?? 0;
  }

  public async markAccepted(seq: number, data?: unknown): Promise<void> {
    this.ctx.db().transaction((tx) => {
      const row = tx.select().from(outbox).where(eq(outbox.seq, seq)).get();
      if (!row) return;

      if (row.entityType === 'ORDER' && row.action === 'CREATE') {
        const adjustments = OrderMapper.toPriceAdjustments(data);
        if (adjustments.length > 0) {
          tx.update(orders)
            .set({ priceAdjustments: adjustments })
            .where(eq(orders.id, row.entityId))
            .run();
        }
      }

      tx.delete(outbox).where(eq(outbox.seq, seq)).run();
      refreshEntitySyncStatus(tx, row.entityType as SyncEntityType, row.entityId);
    });
  }

  public async markRejected(seq: number, error: SyncError): Promise<void> {
    this.ctx.db().transaction((tx) => {
      const row = tx.select().from(outbox).where(eq(outbox.seq, seq)).get();
      if (!row) return;
      tx.update(outbox)
        .set({
          status: 'REJECTED',
          attempts: row.attempts + 1,
          lastErrorCode: error.code,
          lastErrorMessage: error.message,
        })
        .where(eq(outbox.seq, seq))
        .run();
      refreshEntitySyncStatus(tx, row.entityType as SyncEntityType, row.entityId);
    });
  }

  public async markRetry(seq: number, error: SyncError | null): Promise<void> {
    this.ctx
      .db()
      .update(outbox)
      .set({
        attempts: sql`${outbox.attempts} + 1`,
        ...(error && { lastErrorCode: error.code, lastErrorMessage: error.message }),
      })
      .where(eq(outbox.seq, seq))
      .run();
  }

  public async discard(seq: number): Promise<void> {
    this.ctx.db().transaction((tx) => {
      const row = tx.select().from(outbox).where(eq(outbox.seq, seq)).get();
      if (!row) return;
      tx.delete(outbox).where(eq(outbox.seq, seq)).run();
      refreshEntitySyncStatus(tx, row.entityType as SyncEntityType, row.entityId);
    });
  }
}

export const sqliteOutboxRepository = new SqliteOutboxRepository();
