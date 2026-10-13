import { eq, inArray } from 'drizzle-orm';
import type { ISyncLocalStorePort, SyncChangeSet } from '@/core/ports/sync.ports';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { CatalogRowMapper } from '../mappers/catalog-row.mapper';
import { CustomerRowMapper } from '../mappers/customer-row.mapper';
import { OrderRowMapper } from '../mappers/order-row.mapper';
import { VisitRowMapper } from '../mappers/visit-row.mapper';
import { findEntityIdsWithPendingChanges, type DbExecutor } from '../outbox-writer';
import {
  categories,
  customers,
  orderItems,
  orders,
  outbox,
  pendingPhotos,
  products,
  promotions,
  syncMeta,
  visits,
} from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

const META_CURSOR = 'pull_cursor';
const META_LAST_SYNCED_AT = 'last_synced_at';

/** Placeholder timestamp: any real customer row from the server overwrites it. */
const UNKNOWN_TIMESTAMP = '1970-01-01T00:00:00.000Z';

/** Drops the primary key from an upsert's SET clause. */
function withoutId<T extends { id: string }>(row: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = row;
  return rest;
}

/**
 * Writes server state into the device database. Rows with operations still waiting in
 * the outbox are not overwritten: the seller's offline changes win until they are pushed
 * (check-in/out data always wins; the server then returns the merged row).
 */
export class SqliteSyncStoreRepository implements ISyncLocalStorePort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async applyPull(changes: SyncChangeSet): Promise<void> {
    this.ctx.db().transaction((tx) => {
      const pending = findEntityIdsWithPendingChanges(tx);

      for (const customer of changes.customers) {
        if (pending.has(customer.id)) continue;
        const row = CustomerRowMapper.toServerColumns(customer);
        tx.insert(customers)
          .values(row)
          .onConflictDoUpdate({ target: customers.id, set: withoutId(row) })
          .run();
      }

      const deletable = changes.deletedCustomerIds.filter((id) => !pending.has(id));
      if (deletable.length > 0) {
        tx.delete(customers).where(inArray(customers.id, deletable)).run();
      }

      for (const visit of changes.visits) {
        this.ensureCustomerSummary(tx, visit);
        if (pending.has(visit.id)) continue;
        const row = VisitRowMapper.toServerColumns(visit);
        tx.insert(visits)
          .values(row)
          .onConflictDoUpdate({ target: visits.id, set: withoutId(row) })
          .run();
      }

      for (const order of changes.orders) {
        if (pending.has(order.id)) continue;
        const row = OrderRowMapper.toServerColumns(order);
        tx.insert(orders)
          .values(row)
          .onConflictDoUpdate({ target: orders.id, set: withoutId(row) })
          .run();
        tx.delete(orderItems).where(eq(orderItems.orderId, order.id)).run();
        const items = OrderRowMapper.toItemRows(order);
        if (items.length > 0) tx.insert(orderItems).values(items).run();
      }

      for (const product of changes.products) {
        const row = CatalogRowMapper.fromProduct(product);
        tx.insert(products)
          .values(row)
          .onConflictDoUpdate({ target: products.id, set: withoutId(row) })
          .run();
      }

      for (const category of changes.categories) {
        tx.insert(categories)
          .values(category)
          .onConflictDoUpdate({ target: categories.id, set: withoutId(category) })
          .run();
      }

      // Promotions always come as the full active list: replace the local one.
      tx.delete(promotions).run();
      if (changes.promotions.length > 0) tx.insert(promotions).values(changes.promotions).run();
    });
  }

  public async getCursor(): Promise<string | null> {
    return this.getMeta(META_CURSOR);
  }

  public async setCursor(cursor: string | null): Promise<void> {
    this.setMeta(META_CURSOR, cursor);
  }

  public async getLastSyncedAt(): Promise<string | null> {
    return this.getMeta(META_LAST_SYNCED_AT);
  }

  public async setLastSyncedAt(at: string): Promise<void> {
    this.setMeta(META_LAST_SYNCED_AT, at);
  }

  public async clearAll(): Promise<void> {
    this.ctx.db().transaction((tx) => {
      for (const table of [
        orderItems,
        orders,
        visits,
        customers,
        products,
        categories,
        promotions,
        outbox,
        pendingPhotos,
        syncMeta,
      ]) {
        tx.delete(table).run();
      }
    });
  }

  /**
   * A supervisor may schedule a visit to a customer outside the seller's working set:
   * keep the summary that comes with the visit so the agenda can show it.
   */
  private ensureCustomerSummary(tx: DbExecutor, visit: VisitEntity): void {
    const summary = visit.customer;
    if (!summary) return;
    tx.insert(customers)
      .values({
        id: summary.id,
        status: summary.status,
        tradeName: summary.tradeName,
        contactName: summary.contactName,
        phone: summary.phone,
        address: summary.address,
        latitude: summary.latitude,
        longitude: summary.longitude,
        storePhotoUrl: summary.storePhotoUrl,
        createdAt: UNKNOWN_TIMESTAMP,
        updatedAt: UNKNOWN_TIMESTAMP,
      })
      .onConflictDoNothing()
      .run();
  }

  private getMeta(key: string): string | null {
    const row = this.ctx.db().select().from(syncMeta).where(eq(syncMeta.key, key)).get();
    return row?.value ?? null;
  }

  private setMeta(key: string, value: string | null): void {
    const db = this.ctx.db();
    if (value === null) {
      db.delete(syncMeta).where(eq(syncMeta.key, key)).run();
      return;
    }
    db.insert(syncMeta)
      .values({ key, value })
      .onConflictDoUpdate({ target: syncMeta.key, set: { value } })
      .run();
  }
}

export const sqliteSyncStoreRepository = new SqliteSyncStoreRepository();
