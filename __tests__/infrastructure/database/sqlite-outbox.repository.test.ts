import { eq } from 'drizzle-orm';
import { SqliteOutboxRepository } from '@/infrastructure/database/repositories/sqlite-outbox.repository';
import { SqlitePendingPhotoRepository } from '@/infrastructure/database/repositories/sqlite-pending-photo.repository';
import { SqliteOrderRepository } from '@/infrastructure/database/repositories/sqlite-order.repository';
import { SqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { orders, visits } from '@/infrastructure/database/schema';
import type { AppDatabase } from '@/infrastructure/database/database.types';
import { createTestContext, createTestDatabase } from '../../helpers/test-database';
import { insertCustomer, insertProduct, SELLER } from '../../helpers/fixtures';

describe('SqliteOutboxRepository', () => {
  let db: AppDatabase;
  let outboxRepository: SqliteOutboxRepository;
  let visitRepository: SqliteVisitRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    const ctx = createTestContext(db);
    outboxRepository = new SqliteOutboxRepository(ctx);
    visitRepository = new SqliteVisitRepository(ctx);
    insertCustomer(db);
  });

  const visitSyncStatus = (id: string) =>
    db.select({ s: visits.syncStatus }).from(visits).where(eq(visits.id, id)).get()?.s;

  it('lists pending operations in the order they happened', async () => {
    const visit = await visitRepository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-14T15:00:00Z' },
      SELLER,
    );
    await visitRepository.start(visit.id, {});

    const pending = await outboxRepository.listPending(10);
    expect(pending.map((op) => op.action)).toEqual(['SCHEDULE', 'START']);
    expect(await outboxRepository.countPending()).toBe(2);
    expect(await outboxRepository.listPending(1)).toHaveLength(1);
  });

  it('marks the entity SYNCED only when its last operation is accepted', async () => {
    const visit = await visitRepository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-14T15:00:00Z' },
      SELLER,
    );
    await visitRepository.start(visit.id, {});
    const [schedule, start] = await outboxRepository.listPending(10);

    await outboxRepository.markAccepted(schedule.seq);
    expect(visitSyncStatus(visit.id)).toBe('PENDING');

    await outboxRepository.markAccepted(start.seq);
    expect(visitSyncStatus(visit.id)).toBe('SYNCED');
    expect(await outboxRepository.countPending()).toBe(0);
  });

  it('keeps rejected operations with the reason, out of the pending queue', async () => {
    const visit = await visitRepository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-14T15:00:00Z' },
      SELLER,
    );
    const [operation] = await outboxRepository.listPending(10);

    await outboxRepository.markRejected(operation.seq, {
      code: 'CUSTOMER_NOT_FOUND',
      message: 'El cliente no existe',
    });

    expect(await outboxRepository.countPending()).toBe(0);
    const [rejected] = await outboxRepository.listRejected();
    expect(rejected.lastError).toEqual({
      code: 'CUSTOMER_NOT_FOUND',
      message: 'El cliente no existe',
    });
    expect(visitSyncStatus(visit.id)).toBe('REJECTED');

    await outboxRepository.discard(rejected.seq);
    expect(await outboxRepository.listRejected()).toHaveLength(0);
    expect(visitSyncStatus(visit.id)).toBe('SYNCED');
  });

  it('counts retry attempts and keeps the operation pending', async () => {
    await visitRepository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-14T15:00:00Z' },
      SELLER,
    );
    const [operation] = await outboxRepository.listPending(10);

    await outboxRepository.markRetry(operation.seq, { code: 'BILLING_DOWN', message: 'x' });
    await outboxRepository.markRetry(operation.seq, null);

    const [retried] = await outboxRepository.listPending(10);
    expect(retried.attempts).toBe(2);
    expect(retried.lastError?.code).toBe('BILLING_DOWN');
  });

  it('stores price adjustments returned for an accepted order', async () => {
    insertProduct(db);
    const ctx = createTestContext(db);
    const order = await new SqliteOrderRepository(ctx).create(
      { customerId: 'customer-1', items: [{ productId: 'product-1', quantity: 2 }] },
      SELLER,
    );
    const [operation] = await outboxRepository.listPending(10);

    await outboxRepository.markAccepted(operation.seq, {
      orderId: order.id,
      orderNumber: 'ORD-000123',
      priceAdjustments: [{ productId: 'product-1', expectedUnitPrice: 7.8, unitPrice: 8.1 }],
    });

    const row = db.select().from(orders).where(eq(orders.id, order.id)).get();
    expect(row?.priceAdjustments).toEqual([
      { productId: 'product-1', expectedUnitPrice: 7.8, unitPrice: 8.1 },
    ]);
    expect(row?.syncStatus).toBe('SYNCED');
  });
});

describe('SqlitePendingPhotoRepository', () => {
  it('lists photos until they are uploaded and returns their server URL', async () => {
    const db = await createTestDatabase();
    const ctx = createTestContext(db);
    const visitRepository = new SqliteVisitRepository(ctx);
    const photos = new SqlitePendingPhotoRepository(ctx);
    insertCustomer(db);
    const visit = await visitRepository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-14T15:00:00Z' },
      SELLER,
    );
    await visitRepository.start(visit.id, {});
    await visitRepository.complete(visit.id, {
      outcome: 'NO_ORDER',
      photoLocalUri: 'file:///p.jpg',
    });

    const [photo] = await photos.listToUpload();
    expect(await photos.findRemoteUrl(photo.id)).toBeNull();

    await photos.markFailed(photo.id, 'timeout');
    expect((await photos.listToUpload())[0].attempts).toBe(1);

    await photos.markUploaded(photo.id, '/api/v1/files/photos/p.jpg');
    expect(await photos.listToUpload()).toHaveLength(0);
    expect(await photos.findRemoteUrl(photo.id)).toBe('/api/v1/files/photos/p.jpg');
  });
});
