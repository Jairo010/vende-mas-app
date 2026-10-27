import { eq } from 'drizzle-orm';
import { SqliteSyncStoreRepository } from '@/infrastructure/database/repositories/sqlite-sync-store.repository';
import { SqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { SqliteCatalogRepository } from '@/infrastructure/database/repositories/sqlite-catalog.repository';
import { SqliteOrderRepository } from '@/infrastructure/database/repositories/sqlite-order.repository';
import { customers, outbox, visits } from '@/infrastructure/database/schema';
import type { AppDatabase } from '@/infrastructure/database/database.types';
import type { SyncChangeSet } from '@/core/ports/sync.ports';
import { CustomerEntity, type CustomerProps } from '@/core/entities/customer.entity';
import { VisitEntity, type VisitProps } from '@/core/entities/visit.entity';
import { ProductEntity } from '@/core/entities/product.entity';
import { OrderEntity } from '@/core/entities/order.entity';
import { createTestContext, createTestDatabase } from '../../helpers/test-database';
import { insertCustomer, SELLER } from '../../helpers/fixtures';

function emptyChanges(overrides: Partial<SyncChangeSet> = {}): SyncChangeSet {
  return {
    serverTime: '2026-10-14T15:00:00.000Z',
    cursor: 'cursor-1',
    hasMore: false,
    visits: [],
    customers: [],
    deletedCustomerIds: [],
    orders: [],
    products: [],
    categories: [],
    promotions: [],
    receivables: [],
    payments: [],
    settings: null,
    company: null,
    ...overrides,
  };
}

function serverCustomer(overrides: Partial<CustomerProps> = {}): CustomerEntity {
  return CustomerEntity.create({
    id: 'customer-1',
    status: 'ACTIVE',
    tradeName: 'Lubricadora El Pana (servidor)',
    businessName: null,
    identificationType: null,
    identification: null,
    contactName: null,
    phone: null,
    email: null,
    address: null,
    addressReference: null,
    latitude: null,
    longitude: null,
    storePhotoUrl: null,
    storePhotoLocalUri: null,
    assignedSellerId: SELLER.userId,
    createdById: null,
    externalId: 'EXT-1',
    billingSyncStatus: 'EXPORTED',
    isActive: true,
    syncStatus: 'SYNCED',
    createdAt: '2026-10-01T15:00:00.000Z',
    updatedAt: '2026-10-14T15:00:00.000Z',
    ...overrides,
  });
}

function serverVisit(overrides: Partial<VisitProps> = {}): VisitEntity {
  return VisitEntity.create({
    id: 'visit-1',
    type: 'ORDER',
    status: 'SCHEDULED',
    outcome: null,
    scheduledAt: '2026-10-14T16:00:00.000Z',
    notes: null,
    start: null,
    end: null,
    distanceToCustomerMeters: null,
    durationMinutes: null,
    photoUrl: null,
    photoLocalUri: null,
    cancellationReason: null,
    sellerId: SELLER.userId,
    sellerName: 'Carlos Mendoza',
    createdById: 'supervisor-1',
    customerId: 'customer-9',
    parentVisitId: null,
    customer: {
      id: 'customer-9',
      tradeName: 'Repuestos Andrade',
      status: 'ACTIVE',
      contactName: null,
      phone: null,
      address: 'Guayaquil',
      latitude: null,
      longitude: null,
      storePhotoUrl: null,
    },
    syncStatus: 'SYNCED',
    createdAt: '2026-10-14T12:00:00.000Z',
    updatedAt: '2026-10-14T12:00:00.000Z',
    ...overrides,
  });
}

describe('SqliteSyncStoreRepository', () => {
  let db: AppDatabase;
  let ctx: ReturnType<typeof createTestContext>;
  let store: SqliteSyncStoreRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    ctx = createTestContext(db);
    store = new SqliteSyncStoreRepository(ctx);
  });

  it('upserts server customers and removes tombstones', async () => {
    insertCustomer(db, { id: 'customer-1', storePhotoLocalUri: 'file:///local.jpg' });
    insertCustomer(db, { id: 'customer-2' });

    await store.applyPull(
      emptyChanges({
        customers: [serverCustomer(), serverCustomer({ id: 'customer-3', tradeName: 'Nuevo' })],
        deletedCustomerIds: ['customer-2'],
      }),
    );

    const rows = db.select().from(customers).orderBy(customers.id).all();
    expect(rows.map((row) => row.id)).toEqual(['customer-1', 'customer-3']);
    expect(rows[0].tradeName).toBe('Lubricadora El Pana (servidor)');
    // Local-only columns survive the server upsert
    expect(rows[0].storePhotoLocalUri).toBe('file:///local.jpg');
  });

  it('never overwrites rows that still have changes waiting to be pushed', async () => {
    insertCustomer(db);
    const visit = await new SqliteVisitRepository(ctx).schedule(
      { type: 'ORDER', customerId: 'customer-1', scheduledAt: '2026-10-14T15:00:00Z' },
      SELLER,
    );
    await new SqliteVisitRepository(ctx).start(visit.id, {});

    await store.applyPull(
      emptyChanges({
        visits: [serverVisit({ id: visit.id, customerId: 'customer-1', status: 'SCHEDULED' })],
      }),
    );

    const row = db.select().from(visits).where(eq(visits.id, visit.id)).get();
    expect(row?.status).toBe('IN_PROGRESS');
    expect(db.select().from(outbox).all()).toHaveLength(2);
  });

  it('keeps the customer summary of visits scheduled by a supervisor', async () => {
    await store.applyPull(emptyChanges({ visits: [serverVisit()] }));

    const [visit] = await new SqliteVisitRepository(ctx).findByRange({
      from: '2026-10-14T00:00:00.000Z',
      to: '2026-10-15T00:00:00.000Z',
    });
    expect(visit.customer?.tradeName).toBe('Repuestos Andrade');
    expect(visit.sellerName).toBe('Carlos Mendoza');
  });

  it('replaces order items, hides inactive products and replaces promotions', async () => {
    const product = (id: string, isActive: boolean) =>
      ProductEntity.create({
        id,
        code: id,
        name: `Producto ${id}`,
        brand: null,
        description: null,
        categoryId: 'cat-1',
        categoryName: 'Aceites',
        basePrice: 5,
        taxRate: 0.15,
        priceWithTax: 5.75,
        unitOfMeasure: 'UNIT',
        stockQuantity: 10,
        imageUrl: null,
        isActive,
      });
    const order = OrderEntity.create({
      id: 'order-1',
      orderNumber: 'ORD-000123',
      customerId: 'customer-1',
      customerName: 'Lubricadora El Pana',
      visitId: null,
      sellerId: SELLER.userId,
      status: 'CONFIRMED',
      subtotal: 10,
      discountTotal: 0,
      taxTotal: 1.5,
      total: 11.5,
      estimatedDeliveryDate: null,
      paymentPlan: { type: 'SINGLE', installments: 1, firstDueDate: null },
      notes: null,
      billingSyncStatus: 'EXPORTED',
      invoiceNumber: null,
      priceAdjustments: [],
      items: [
        {
          id: 'item-1',
          productId: 'p1',
          productCode: 'p1',
          productName: 'Producto p1',
          quantity: 2,
          unitPrice: 5,
          discount: 0,
          totalPrice: 10,
          taxRate: 0.15,
          taxAmount: 1.5,
          promotionName: null,
        },
      ],
      syncStatus: 'SYNCED',
      createdAt: '2026-10-14T15:00:00.000Z',
      updatedAt: '2026-10-14T15:00:00.000Z',
    });
    const promotion = {
      id: 'promo-1',
      name: 'Promo aceites',
      description: null,
      discountType: 'PERCENTAGE' as const,
      discountValue: 10,
      targetType: 'GLOBAL' as const,
      targetCategoryId: null,
      targetProductIds: [],
      minQuantity: 1,
      startsAt: '2026-10-01T00:00:00.000Z',
      endsAt: '2026-10-31T00:00:00.000Z',
    };

    await store.applyPull(
      emptyChanges({
        orders: [order, order],
        products: [product('p1', true), product('p2', false)],
        categories: [
          { id: 'cat-1', code: 'OIL', name: 'Aceites', description: null, isActive: true },
        ],
        promotions: [promotion],
      }),
    );
    await store.applyPull(emptyChanges({ promotions: [{ ...promotion, id: 'promo-2' }] }));

    const catalog = new SqliteCatalogRepository(ctx);
    expect((await catalog.findProducts()).map((p) => p.id)).toEqual(['p1']);
    expect((await catalog.findCategories()).map((c) => c.id)).toEqual(['cat-1']);
    expect((await catalog.findActivePromotions()).map((p) => p.id)).toEqual(['promo-2']);
    const [saved] = await new SqliteOrderRepository(ctx).findAll();
    expect(saved.orderNumber).toBe('ORD-000123');
    expect(saved.items).toHaveLength(1);
  });

  it('keeps the cursor and last sync time, and wipes everything on clearAll', async () => {
    await store.setCursor('abc');
    await store.setLastSyncedAt('2026-10-14T15:00:00.000Z');
    expect(await store.getCursor()).toBe('abc');
    await store.setCursor(null);
    expect(await store.getCursor()).toBeNull();

    insertCustomer(db);
    await store.clearAll();
    expect(db.select().from(customers).all()).toHaveLength(0);
    expect(await store.getLastSyncedAt()).toBeNull();
  });
});
