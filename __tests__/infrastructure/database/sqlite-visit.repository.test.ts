import { eq } from 'drizzle-orm';
import { SqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { outbox, pendingPhotos, customers } from '@/infrastructure/database/schema';
import type { AppDatabase } from '@/infrastructure/database/database.types';
import { CustomerNotFoundError } from '@/core/errors/customer.errors';
import {
  VisitInvalidTransitionError,
  VisitOutcomeNotAllowedError,
  VisitStorePhotoRequiredError,
} from '@/core/errors/visit.errors';
import { createTestContext, createTestDatabase } from '../../helpers/test-database';
import { insertCustomer, SELLER } from '../../helpers/fixtures';

describe('SqliteVisitRepository', () => {
  let db: AppDatabase;
  let ctx: ReturnType<typeof createTestContext>;
  let repository: SqliteVisitRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    ctx = createTestContext(db, new Date('2026-10-14T14:00:00.000Z'));
    repository = new SqliteVisitRepository(ctx);
    insertCustomer(db);
  });

  const outboxRows = () => db.select().from(outbox).orderBy(outbox.seq).all();

  it('schedules a visit locally and queues VISIT SCHEDULE with a local-offset date', async () => {
    const visit = await repository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-15T14:30:00.000Z' },
      SELLER,
    );

    expect(visit.status).toBe('SCHEDULED');
    expect(visit.sellerId).toBe(SELLER.userId);
    expect(visit.syncStatus).toBe('PENDING');
    expect(visit.customer?.tradeName).toBe('Lubricadora El Pana');

    const [operation] = outboxRows();
    expect(operation).toMatchObject({
      idempotencyKey: `visit-schedule-${visit.id}`,
      entityType: 'VISIT',
      entityId: visit.id,
      action: 'SCHEDULE',
      status: 'PENDING',
      clientTimestamp: '2026-10-14T09:00:00-05:00',
    });
    // Ecuador local time, no undefined keys (the API validates payloads strictly)
    expect(operation.payload).toEqual({
      id: visit.id,
      type: 'ORDER',
      customerId: 'customer-1',
      scheduledAt: '2026-10-15T09:30:00-05:00',
      hasScheduledTime: true,
    });
  });

  it('schedules a visit for the day only, without an agreed time', async () => {
    const visit = await repository.schedule(
      {
        type: 'COLLECTION',
        customerId: 'customer-1',
        scheduledAt: '2026-10-15T05:00:00.000Z',
        hasScheduledTime: false,
      },
      SELLER,
    );

    expect(visit.hasScheduledTime).toBe(false);
    expect(outboxRows()[0]?.payload).toMatchObject({
      scheduledAt: '2026-10-15T00:00:00-05:00',
      hasScheduledTime: false,
    });

    const rescheduled = await repository.reschedule(visit.id, {
      scheduledAt: '2026-10-16T15:00:00.000Z',
      hasScheduledTime: true,
    });
    expect(rescheduled.hasScheduledTime).toBe(true);
    expect(outboxRows()[1]?.payload).toEqual({
      scheduledAt: '2026-10-16T10:00:00-05:00',
      hasScheduledTime: true,
    });
  });

  it('refuses to schedule for a customer that is not on the device', async () => {
    await expect(
      repository.schedule(
        { type: 'ORDER', customerId: 'missing', scheduledAt: '2026-10-15T14:30:00.000Z' },
        SELLER,
      ),
    ).rejects.toBeInstanceOf(CustomerNotFoundError);
    expect(outboxRows()).toHaveLength(0);
  });

  it('runs the whole visit offline: schedule → start → complete, queued in order', async () => {
    const scheduled = await repository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-14T15:00:00.000Z' },
      SELLER,
    );

    ctx.setNow(new Date('2026-10-14T15:05:00.000Z'));
    const started = await repository.start(scheduled.id, {
      location: { latitude: -0.28, longitude: -78.5446, accuracyMeters: 8 },
    });
    expect(started.status).toBe('IN_PROGRESS');
    expect(started.start?.location).toEqual({
      latitude: -0.28,
      longitude: -78.5446,
      accuracyMeters: 8,
    });
    expect(started.distanceToCustomerMeters).toBeGreaterThan(0);
    expect(started.distanceToCustomerMeters).toBeLessThan(50);

    ctx.setNow(new Date('2026-10-14T15:35:00.000Z'));
    const completed = await repository.complete(scheduled.id, {
      outcome: 'ORDER_TAKEN',
      notes: 'Pidió 12 aceites',
    });
    expect(completed.status).toBe('COMPLETED');
    expect(completed.outcome).toBe('ORDER_TAKEN');
    expect(completed.durationMinutes).toBe(30);

    expect(outboxRows().map((row) => row.action)).toEqual(['SCHEDULE', 'START', 'COMPLETE']);
    expect(outboxRows()[2].payload).toEqual({
      outcome: 'ORDER_TAKEN',
      endedAt: '2026-10-14T10:35:00-05:00',
      notes: 'Pidió 12 aceites',
    });
  });

  it('validates the state machine before queueing anything', async () => {
    const visit = await repository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-14T15:00:00.000Z' },
      SELLER,
    );

    await expect(repository.complete(visit.id, { outcome: 'ORDER_TAKEN' })).rejects.toBeInstanceOf(
      VisitInvalidTransitionError,
    );
    await repository.start(visit.id, {});
    await expect(repository.complete(visit.id, { outcome: 'COLLECTED' })).rejects.toBeInstanceOf(
      VisitOutcomeNotAllowedError,
    );
    await expect(
      repository.reschedule(visit.id, { scheduledAt: '2026-10-20T15:00:00Z' }),
    ).rejects.toBeInstanceOf(VisitInvalidTransitionError);

    expect(outboxRows().map((row) => row.action)).toEqual(['SCHEDULE', 'START']);
  });

  it('requires the store photo to close the first opportunity visit', async () => {
    insertCustomer(db, { id: 'prospect-1', status: 'PROSPECT', storePhotoUrl: null });
    const visit = await repository.schedule(
      { type: 'OPPORTUNITY', customerId: 'prospect-1', scheduledAt: '2026-10-14T15:00:00.000Z' },
      SELLER,
    );
    await repository.start(visit.id, {});

    await expect(repository.complete(visit.id, { outcome: 'INTERESTED' })).rejects.toBeInstanceOf(
      VisitStorePhotoRequiredError,
    );

    const completed = await repository.complete(visit.id, {
      outcome: 'INTERESTED',
      photoLocalUri: 'file:///documents/pending-photos/p.jpg',
    });
    expect(completed.photoLocalUri).toBe('file:///documents/pending-photos/p.jpg');

    // The photo waits for upload and the COMPLETE operation points at it
    const [photo] = db.select().from(pendingPhotos).all();
    expect(photo).toMatchObject({ localUri: 'file:///documents/pending-photos/p.jpg' });
    const complete = outboxRows().find((row) => row.action === 'COMPLETE');
    expect(complete).toMatchObject({ photoId: photo.id, photoField: 'photoUrl' });
    expect(complete?.payload).not.toHaveProperty('photoUrl');

    // The store photo is mirrored locally (the server replaces it with the visit photo)
    const prospect = db.select().from(customers).where(eq(customers.id, 'prospect-1')).get();
    expect(prospect?.storePhotoLocalUri).toBe('file:///documents/pending-photos/p.jpg');
  });

  it('reschedules and cancels with unique / deterministic idempotency keys', async () => {
    const visit = await repository.schedule(
      { type: 'COLLECTION', customerId: 'customer-1', scheduledAt: '2026-10-14T15:00:00.000Z' },
      SELLER,
    );
    await repository.reschedule(visit.id, { scheduledAt: '2026-10-16T15:00:00.000Z' });
    await repository.reschedule(visit.id, { scheduledAt: '2026-10-17T15:00:00.000Z' });
    const cancelled = await repository.cancel(visit.id, { reason: 'Local cerrado' });

    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancellationReason).toBe('Local cerrado');
    const keys = outboxRows().map((row) => row.idempotencyKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys[3]).toBe(`visit-cancel-${visit.id}`);
  });

  it('finds visits by range ordered by time and the one in progress', async () => {
    const late = await repository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-14T20:00:00.000Z' },
      SELLER,
    );
    const early = await repository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-14T13:00:00.000Z' },
      SELLER,
    );
    await repository.schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-16T13:00:00.000Z' },
      SELLER,
    );

    const day = await repository.findByRange({
      from: '2026-10-14T05:00:00.000Z',
      to: '2026-10-15T04:59:59.999Z',
    });
    expect(day.map((visit) => visit.id)).toEqual([early.id, late.id]);

    expect(await repository.findInProgress(SELLER.userId)).toBeNull();
    await repository.start(early.id, {});
    expect((await repository.findInProgress(SELLER.userId))?.id).toBe(early.id);
  });
});
