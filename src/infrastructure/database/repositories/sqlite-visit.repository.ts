import { and, asc, desc, eq, gte, inArray, lte, type SQL } from 'drizzle-orm';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { CustomerNotFoundError } from '@/core/errors/customer.errors';
import {
  VisitAlreadyInProgressError,
  VisitCustomerNotInvoiceableError,
  VisitNotFoundError,
  VisitParentNotFoundError,
  VisitStorePhotoRequiredError,
} from '@/core/errors/visit.errors';
import type { ActorContext, IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { GeoPoint } from '@/core/types/geo.types';
import {
  VISIT_TYPES_REQUIRING_ACTIVE_CUSTOMER,
  type CancelVisitInput,
  type CompleteVisitInput,
  type RescheduleVisitInput,
  type ScheduleVisitInput,
  type StartVisitInput,
  type VisitFilter,
} from '@/core/types/visit.types';
import { distanceInMeters } from '@/core/value-objects/geo-distance';
import type {
  CancelVisitRequestDto,
  CompleteVisitRequestDto,
  RescheduleVisitRequestDto,
  ScheduleVisitRequestDto,
  StartVisitRequestDto,
} from '@/infrastructure/api/dto/visit.dto';
import { toZonedIsoString } from '@/shared/utils/date';
import type { CustomerRow } from '../mappers/customer-row.mapper';
import { VisitRowMapper } from '../mappers/visit-row.mapper';
import {
  buildIdempotencyKey,
  compactPayload as compact,
  enqueueOperation,
  registerPendingPhoto,
  type DbExecutor,
} from '../outbox-writer';
import { customers, visits } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

function toLocationDto(location?: GeoPoint) {
  if (!location) return undefined;
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    ...(location.accuracyMeters !== undefined && { accuracyMeters: location.accuracyMeters }),
  };
}

export class SqliteVisitRepository implements IVisitRepositoryPort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async findByRange(filter: VisitFilter): Promise<VisitEntity[]> {
    const conditions: SQL[] = [
      gte(visits.scheduledAt, filter.from),
      lte(visits.scheduledAt, filter.to),
    ];
    if (filter.statuses?.length) conditions.push(inArray(visits.status, filter.statuses));
    if (filter.customerId) conditions.push(eq(visits.customerId, filter.customerId));

    return this.ctx
      .db()
      .select()
      .from(visits)
      .leftJoin(customers, eq(customers.id, visits.customerId))
      .where(and(...conditions))
      .orderBy(asc(visits.scheduledAt))
      .all()
      .map((row) => VisitRowMapper.toDomain(row.visits, row.customers));
  }

  public async findById(id: string): Promise<VisitEntity | null> {
    return this.load(this.ctx.db(), id);
  }

  public async findByCustomer(customerId: string, limit = 50): Promise<VisitEntity[]> {
    return this.ctx
      .db()
      .select()
      .from(visits)
      .leftJoin(customers, eq(customers.id, visits.customerId))
      .where(eq(visits.customerId, customerId))
      .orderBy(desc(visits.scheduledAt))
      .limit(limit)
      .all()
      .map((row) => VisitRowMapper.toDomain(row.visits, row.customers));
  }

  public async findInProgress(sellerId: string): Promise<VisitEntity | null> {
    const row = this.ctx
      .db()
      .select()
      .from(visits)
      .leftJoin(customers, eq(customers.id, visits.customerId))
      .where(and(eq(visits.sellerId, sellerId), eq(visits.status, 'IN_PROGRESS')))
      .orderBy(asc(visits.startedAt))
      .get();
    return row ? VisitRowMapper.toDomain(row.visits, row.customers) : null;
  }

  public async schedule(input: ScheduleVisitInput, actor: ActorContext): Promise<VisitEntity> {
    const id = this.ctx.newId();
    const now = this.ctx.now();
    const nowIso = now.toISOString();
    const scheduledAt = new Date(input.scheduledAt).toISOString();
    const sellerId = input.sellerId ?? actor.userId;

    return this.ctx.db().transaction((tx) => {
      const customer = this.requireCustomer(tx, input.customerId);
      if (
        VISIT_TYPES_REQUIRING_ACTIVE_CUSTOMER.includes(input.type) &&
        customer.status !== 'ACTIVE'
      ) {
        throw new VisitCustomerNotInvoiceableError(
          'Solo los clientes activos reciben visitas de pedido o cobro',
        );
      }
      if (input.parentVisitId) {
        // A follow-up belongs to the same customer as its origin (API rule).
        const parent = this.load(tx, input.parentVisitId);
        if (!parent || parent.customerId !== input.customerId) {
          throw new VisitParentNotFoundError();
        }
      }

      tx.insert(visits)
        .values({
          id,
          type: input.type,
          status: 'SCHEDULED',
          scheduledAt,
          notes: input.notes ?? null,
          sellerId,
          sellerName: sellerId === actor.userId ? (actor.userName ?? null) : null,
          createdById: actor.userId,
          customerId: input.customerId,
          parentVisitId: input.parentVisitId ?? null,
          syncStatus: 'PENDING',
          createdAt: nowIso,
          updatedAt: nowIso,
        })
        .run();

      const payload: ScheduleVisitRequestDto = {
        id,
        type: input.type,
        customerId: input.customerId,
        scheduledAt: toZonedIsoString(scheduledAt),
        notes: input.notes,
        sellerId: input.sellerId,
        parentVisitId: input.parentVisitId,
      };
      this.enqueue(tx, id, 'SCHEDULE', compact(payload), now);

      return this.loadOrThrow(tx, id);
    });
  }

  public async start(id: string, input: StartVisitInput): Promise<VisitEntity> {
    const now = this.ctx.now();
    const nowIso = now.toISOString();

    return this.ctx.db().transaction((tx) => {
      const visit = this.loadOrThrow(tx, id);
      visit.assertCanStart();

      // Same rule as the API: one visit in progress per seller.
      const active = tx
        .select({ id: visits.id })
        .from(visits)
        .where(and(eq(visits.sellerId, visit.sellerId), eq(visits.status, 'IN_PROGRESS')))
        .get();
      if (active && active.id !== id) throw new VisitAlreadyInProgressError(active.id);

      const customer = visit.customer;
      const customerHasLocation = customer?.latitude != null && customer.longitude != null;
      const distance =
        input.location && customer?.latitude != null && customer.longitude != null
          ? distanceInMeters(input.location, {
              latitude: customer.latitude,
              longitude: customer.longitude,
            })
          : null;

      tx.update(visits)
        .set({
          status: 'IN_PROGRESS',
          startedAt: nowIso,
          startLatitude: input.location?.latitude ?? null,
          startLongitude: input.location?.longitude ?? null,
          startAccuracyMeters: input.location?.accuracyMeters ?? null,
          distanceToCustomerMeters: distance,
          syncStatus: 'PENDING',
          updatedAt: nowIso,
        })
        .where(eq(visits.id, id))
        .run();

      // The first check-in at a store without coordinates pins its location (the server
      // does the same when it applies the check-in).
      if (input.location && customer && !customerHasLocation) {
        tx.update(customers)
          .set({
            latitude: input.location.latitude,
            longitude: input.location.longitude,
            updatedAt: nowIso,
          })
          .where(eq(customers.id, customer.id))
          .run();
      }

      const payload: StartVisitRequestDto = {
        startedAt: toZonedIsoString(now),
        location: toLocationDto(input.location),
      };
      this.enqueue(tx, id, 'START', compact(payload), now);

      return this.loadOrThrow(tx, id);
    });
  }

  public async complete(id: string, input: CompleteVisitInput): Promise<VisitEntity> {
    const now = this.ctx.now();
    const nowIso = now.toISOString();
    const photoId = input.photoLocalUri ? this.ctx.newId() : null;

    return this.ctx.db().transaction((tx) => {
      const visit = this.loadOrThrow(tx, id);
      const customer = this.requireCustomer(tx, visit.customerId);
      visit.assertCanComplete(input.outcome, customer.status === 'ACTIVE');

      const customerHasPhoto = Boolean(customer.storePhotoUrl || customer.storePhotoLocalUri);
      if (visit.needsStorePhoto(customerHasPhoto) && !input.photoLocalUri) {
        throw new VisitStorePhotoRequiredError();
      }

      const durationMinutes = visit.start
        ? Math.max(0, Math.round((now.getTime() - new Date(visit.start.at).getTime()) / 60_000))
        : null;

      tx.update(visits)
        .set({
          status: 'COMPLETED',
          outcome: input.outcome,
          endedAt: nowIso,
          endLatitude: input.location?.latitude ?? null,
          endLongitude: input.location?.longitude ?? null,
          endAccuracyMeters: input.location?.accuracyMeters ?? null,
          durationMinutes,
          notes: input.notes ?? visit.notes,
          photoLocalUri: input.photoLocalUri ?? null,
          syncStatus: 'PENDING',
          updatedAt: nowIso,
        })
        .where(eq(visits.id, id))
        .run();

      if (photoId && input.photoLocalUri) {
        registerPendingPhoto(tx, photoId, input.photoLocalUri, nowIso);
        // The server replaces the store photo with the visit photo: mirror it locally.
        tx.update(customers)
          .set({ storePhotoLocalUri: input.photoLocalUri, updatedAt: nowIso })
          .where(eq(customers.id, visit.customerId))
          .run();
      }

      const payload: CompleteVisitRequestDto = {
        outcome: input.outcome,
        endedAt: toZonedIsoString(now),
        location: toLocationDto(input.location),
        notes: input.notes,
      };
      this.enqueue(tx, id, 'COMPLETE', compact(payload), now, photoId);

      return this.loadOrThrow(tx, id);
    });
  }

  public async reschedule(id: string, input: RescheduleVisitInput): Promise<VisitEntity> {
    const now = this.ctx.now();
    const nowIso = now.toISOString();
    const scheduledAt = new Date(input.scheduledAt).toISOString();

    return this.ctx.db().transaction((tx) => {
      const visit = this.loadOrThrow(tx, id);
      visit.assertCanReschedule();

      tx.update(visits)
        .set({
          scheduledAt,
          notes: input.notes ?? visit.notes,
          syncStatus: 'PENDING',
          updatedAt: nowIso,
        })
        .where(eq(visits.id, id))
        .run();

      const payload: RescheduleVisitRequestDto = {
        scheduledAt: toZonedIsoString(scheduledAt),
        notes: input.notes,
      };
      this.enqueue(tx, id, 'RESCHEDULE', compact(payload), now);

      return this.loadOrThrow(tx, id);
    });
  }

  public async cancel(id: string, input: CancelVisitInput): Promise<VisitEntity> {
    const now = this.ctx.now();
    const nowIso = now.toISOString();

    return this.ctx.db().transaction((tx) => {
      const visit = this.loadOrThrow(tx, id);
      visit.assertCanCancel();

      tx.update(visits)
        .set({
          status: 'CANCELLED',
          cancellationReason: input.reason ?? null,
          syncStatus: 'PENDING',
          updatedAt: nowIso,
        })
        .where(eq(visits.id, id))
        .run();

      const payload: CancelVisitRequestDto = {
        reason: input.reason,
        cancelledAt: toZonedIsoString(now),
      };
      this.enqueue(tx, id, 'CANCEL', compact(payload), now);

      return this.loadOrThrow(tx, id);
    });
  }

  private enqueue(
    tx: DbExecutor,
    visitId: string,
    action: 'SCHEDULE' | 'START' | 'COMPLETE' | 'RESCHEDULE' | 'CANCEL',
    payload: Record<string, unknown>,
    now: Date,
    photoId: string | null = null,
  ): void {
    enqueueOperation(
      tx,
      {
        idempotencyKey: buildIdempotencyKey('VISIT', action, visitId, this.ctx.newId()),
        entityType: 'VISIT',
        entityId: visitId,
        action,
        payload,
        clientTimestamp: toZonedIsoString(now),
        ...(photoId && { photoId, photoField: 'photoUrl' }),
      },
      now.toISOString(),
    );
  }

  private load(db: DbExecutor, id: string): VisitEntity | null {
    const row = db
      .select()
      .from(visits)
      .leftJoin(customers, eq(customers.id, visits.customerId))
      .where(eq(visits.id, id))
      .get();
    return row ? VisitRowMapper.toDomain(row.visits, row.customers) : null;
  }

  private loadOrThrow(db: DbExecutor, id: string): VisitEntity {
    const visit = this.load(db, id);
    if (!visit) throw new VisitNotFoundError();
    return visit;
  }

  private requireCustomer(db: DbExecutor, customerId: string): CustomerRow {
    const row = db.select().from(customers).where(eq(customers.id, customerId)).get();
    if (!row) throw new CustomerNotFoundError();
    return row;
  }
}

export const sqliteVisitRepository = new SqliteVisitRepository();
