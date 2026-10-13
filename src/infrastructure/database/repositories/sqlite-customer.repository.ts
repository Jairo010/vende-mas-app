import { and, asc, eq, like, ne, or, type SQL } from 'drizzle-orm';
import type { CustomerEntity } from '@/core/entities/customer.entity';
import {
  CustomerAlreadyActiveError,
  CustomerIdentificationTakenError,
  CustomerNotFoundError,
} from '@/core/errors/customer.errors';
import type { ICustomerRepositoryPort } from '@/core/ports/customer.repository.port';
import type { ActorContext } from '@/core/ports/visit.repository.port';
import type {
  CreateCustomerInput,
  CustomerFilter,
  PromoteCustomerInput,
  UpdateCustomerInput,
} from '@/core/types/customer.types';
import type { SyncAction } from '@/core/types/sync.types';
import type {
  CreateCustomerRequestDto,
  PromoteCustomerRequestDto,
  UpdateCustomerRequestDto,
} from '@/infrastructure/api/dto/customer.dto';
import { toZonedIsoString } from '@/shared/utils/date';
import { CustomerRowMapper } from '../mappers/customer-row.mapper';
import {
  buildIdempotencyKey,
  compactPayload,
  enqueueOperation,
  findEntityIdsWithPendingChanges,
  registerPendingPhoto,
  type DbExecutor,
} from '../outbox-writer';
import { customers, orders, visits } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

const DEFAULT_SEARCH_LIMIT = 50;

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Same normalization as the API: no spaces or dashes, upper case (passports). */
export function normalizeIdentification(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

function withoutId<T extends { id: string }>(row: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = row;
  return rest;
}

export class SqliteCustomerRepository implements ICustomerRepositoryPort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async search(filter: CustomerFilter = {}): Promise<CustomerEntity[]> {
    const conditions: SQL[] = [eq(customers.isActive, true)];
    const term = clean(filter.search);
    if (term) {
      const pattern = `%${term}%`;
      conditions.push(
        or(
          like(customers.tradeName, pattern),
          like(customers.businessName, pattern),
          like(customers.identification, pattern),
        ) as SQL,
      );
    }
    if (filter.status) conditions.push(eq(customers.status, filter.status));

    return this.ctx
      .db()
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(asc(customers.tradeName))
      .limit(filter.limit ?? DEFAULT_SEARCH_LIMIT)
      .all()
      .map(CustomerRowMapper.toDomain);
  }

  public async findById(id: string): Promise<CustomerEntity | null> {
    const row = this.ctx.db().select().from(customers).where(eq(customers.id, id)).get();
    return row ? CustomerRowMapper.toDomain(row) : null;
  }

  public async findByIdentification(identification: string): Promise<CustomerEntity | null> {
    const normalized = normalizeIdentification(identification);
    if (!normalized) return null;
    const row = this.ctx
      .db()
      .select()
      .from(customers)
      .where(eq(customers.identification, normalized))
      .get();
    return row ? CustomerRowMapper.toDomain(row) : null;
  }

  public async saveFromServer(customer: CustomerEntity): Promise<CustomerEntity> {
    return this.ctx.db().transaction((tx) => {
      // Local changes still waiting to be sent win (same rule as the pull).
      if (!findEntityIdsWithPendingChanges(tx).has(customer.id)) {
        const row = CustomerRowMapper.toServerColumns(customer);
        tx.insert(customers)
          .values({ ...row, syncStatus: 'SYNCED' })
          .onConflictDoUpdate({ target: customers.id, set: withoutId(row) })
          .run();
      }
      return this.loadOrThrow(tx, customer.id);
    });
  }

  public async create(input: CreateCustomerInput, actor: ActorContext): Promise<CustomerEntity> {
    const id = this.ctx.newId();
    const photoId = input.storePhotoLocalUri ? this.ctx.newId() : null;
    const now = this.ctx.now();
    const nowIso = now.toISOString();
    const status = input.status ?? 'PROSPECT';
    const identification = input.identification
      ? normalizeIdentification(input.identification) || undefined
      : undefined;

    return this.ctx.db().transaction((tx) => {
      if (identification) this.assertIdentificationFree(tx, identification, id);

      tx.insert(customers)
        .values({
          id,
          status,
          tradeName: input.tradeName.trim(),
          businessName: clean(input.businessName) ?? null,
          identificationType: input.identificationType ?? null,
          identification: identification ?? null,
          contactName: clean(input.contactName) ?? null,
          phone: clean(input.phone) ?? null,
          email: clean(input.email) ?? null,
          address: clean(input.address) ?? null,
          addressReference: clean(input.addressReference) ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          storePhotoLocalUri: input.storePhotoLocalUri ?? null,
          // Sellers are always assigned to themselves (server rule).
          assignedSellerId: actor.userId,
          createdById: actor.userId,
          billingSyncStatus: status === 'ACTIVE' ? 'PENDING' : 'NOT_REQUIRED',
          isActive: true,
          syncStatus: 'PENDING',
          createdAt: nowIso,
          updatedAt: nowIso,
        })
        .run();

      if (photoId && input.storePhotoLocalUri) {
        registerPendingPhoto(tx, photoId, input.storePhotoLocalUri, nowIso);
      }

      const payload: CreateCustomerRequestDto = {
        id,
        status,
        tradeName: input.tradeName.trim(),
        businessName: clean(input.businessName),
        identificationType: input.identificationType,
        identification,
        contactName: clean(input.contactName),
        phone: clean(input.phone),
        email: clean(input.email),
        address: clean(input.address),
        addressReference: clean(input.addressReference),
        latitude: input.latitude,
        longitude: input.longitude,
      };
      this.enqueue(tx, id, 'CREATE', compactPayload(payload), now, photoId);

      return this.loadOrThrow(tx, id);
    });
  }

  public async update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity> {
    const photoId = input.storePhotoLocalUri ? this.ctx.newId() : null;
    const now = this.ctx.now();
    const nowIso = now.toISOString();
    const { storePhotoLocalUri, ...fields } = input;

    return this.ctx.db().transaction((tx) => {
      this.loadOrThrow(tx, id);

      tx.update(customers)
        .set({
          ...compactPayload(fields),
          ...(storePhotoLocalUri && { storePhotoLocalUri }),
          syncStatus: 'PENDING',
          updatedAt: nowIso,
        })
        .where(eq(customers.id, id))
        .run();

      if (photoId && storePhotoLocalUri) {
        registerPendingPhoto(tx, photoId, storePhotoLocalUri, nowIso);
      }

      const payload: UpdateCustomerRequestDto = { ...fields };
      this.enqueue(tx, id, 'UPDATE', compactPayload(payload), now, photoId);

      return this.loadOrThrow(tx, id);
    });
  }

  public async promote(id: string, input: PromoteCustomerInput): Promise<CustomerEntity> {
    const now = this.ctx.now();
    const nowIso = now.toISOString();

    return this.ctx.db().transaction((tx) => {
      const customer = this.loadOrThrow(tx, id);
      if (!customer.isProspect()) throw new CustomerAlreadyActiveError();
      const identification = normalizeIdentification(input.identification);

      const payload: PromoteCustomerRequestDto = {
        businessName: input.businessName.trim(),
        identificationType: input.identificationType,
        identification,
        address: input.address.trim(),
        email: input.email.trim(),
        phone: clean(input.phone),
        contactName: clean(input.contactName),
      };

      // The RUC / cédula already belongs to a registered customer: the prospect was that
      // customer. Same rule as the API (which merges when it applies this PROMOTE).
      const owner = tx
        .select()
        .from(customers)
        .where(and(eq(customers.identification, identification), ne(customers.id, id)))
        .get();
      if (owner) {
        const merged = this.mergeLocally(
          tx,
          customer,
          CustomerRowMapper.toDomain(owner),
          payload,
          nowIso,
        );
        this.enqueue(tx, id, 'PROMOTE', compactPayload(payload), now);
        return merged;
      }

      tx.update(customers)
        .set({
          status: 'ACTIVE',
          businessName: payload.businessName,
          identificationType: payload.identificationType,
          identification: payload.identification,
          address: payload.address,
          email: payload.email,
          ...(payload.phone && { phone: payload.phone }),
          ...(payload.contactName && { contactName: payload.contactName }),
          billingSyncStatus: 'PENDING',
          syncStatus: 'PENDING',
          updatedAt: nowIso,
        })
        .where(eq(customers.id, id))
        .run();

      this.enqueue(tx, id, 'PROMOTE', compactPayload(payload), now);

      return this.loadOrThrow(tx, id);
    });
  }

  private enqueue(
    tx: DbExecutor,
    customerId: string,
    action: Extract<SyncAction, 'CREATE' | 'UPDATE' | 'PROMOTE'>,
    payload: Record<string, unknown>,
    now: Date,
    photoId: string | null = null,
  ): void {
    enqueueOperation(
      tx,
      {
        idempotencyKey: buildIdempotencyKey('CUSTOMER', action, customerId, this.ctx.newId()),
        entityType: 'CUSTOMER',
        entityId: customerId,
        action,
        payload,
        clientTimestamp: toZonedIsoString(now),
        ...(photoId && { photoId, photoField: 'storePhotoUrl' }),
      },
      now.toISOString(),
    );
  }

  /**
   * Moves the prospect's visits and orders to the registered customer, lets that customer
   * take over what it is missing (photo, location, contact) and removes the prospect.
   */
  private mergeLocally(
    tx: DbExecutor,
    prospect: CustomerEntity,
    owner: CustomerEntity,
    billing: PromoteCustomerRequestDto,
    nowIso: string,
  ): CustomerEntity {
    const ownerHasLocation = owner.hasLocation();
    tx.update(customers)
      .set({
        ...(owner.isProspect() && {
          status: 'ACTIVE',
          businessName: billing.businessName,
          identificationType: billing.identificationType,
          address: billing.address,
          email: billing.email,
          billingSyncStatus: 'PENDING',
        }),
        contactName: owner.contactName ?? prospect.contactName,
        phone: owner.phone ?? prospect.phone,
        addressReference: owner.addressReference ?? prospect.addressReference,
        latitude: ownerHasLocation ? owner.latitude : prospect.latitude,
        longitude: ownerHasLocation ? owner.longitude : prospect.longitude,
        ...(!owner.hasStorePhoto() && {
          storePhotoUrl: prospect.storePhotoUrl,
          storePhotoLocalUri: prospect.storePhotoLocalUri,
        }),
        updatedAt: nowIso,
      })
      .where(eq(customers.id, owner.id))
      .run();
    tx.update(visits).set({ customerId: owner.id }).where(eq(visits.customerId, prospect.id)).run();
    tx.update(orders)
      .set({ customerId: owner.id, customerName: owner.tradeName })
      .where(eq(orders.customerId, prospect.id))
      .run();
    tx.delete(customers).where(eq(customers.id, prospect.id)).run();
    return this.loadOrThrow(tx, owner.id);
  }

  /** Identifications are unique (the API rejects duplicates): catch it before queuing. */
  private assertIdentificationFree(db: DbExecutor, identification: string, ownId: string): void {
    const other = db
      .select({ tradeName: customers.tradeName })
      .from(customers)
      .where(and(eq(customers.identification, identification), ne(customers.id, ownId)))
      .get();
    if (other) throw new CustomerIdentificationTakenError(other.tradeName);
  }

  private loadOrThrow(db: DbExecutor, id: string): CustomerEntity {
    const row = db.select().from(customers).where(eq(customers.id, id)).get();
    if (!row) throw new CustomerNotFoundError();
    return CustomerRowMapper.toDomain(row);
  }
}

export const sqliteCustomerRepository = new SqliteCustomerRepository();
