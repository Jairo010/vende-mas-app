import { SqliteOrderRepository } from '@/infrastructure/database/repositories/sqlite-order.repository';
import { outbox } from '@/infrastructure/database/schema';
import type { AppDatabase } from '@/infrastructure/database/database.types';
import {
  OrderCustomerNotActiveError,
  OrderEmptyError,
  OrderProductUnavailableError,
} from '@/core/errors/order.errors';
import { createTestContext, createTestDatabase } from '../../helpers/test-database';
import { insertCustomer, insertProduct, SELLER } from '../../helpers/fixtures';

describe('SqliteOrderRepository', () => {
  let db: AppDatabase;
  let repository: SqliteOrderRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repository = new SqliteOrderRepository(createTestContext(db));
    insertCustomer(db);
    insertProduct(db);
    insertProduct(db, {
      id: 'product-2',
      code: 'FIL-010',
      name: 'Filtro de aceite',
      basePrice: 3.25,
    });
  });

  it('creates an offline order with estimated totals (IVA 15%) and no official number', async () => {
    const order = await repository.create(
      {
        customerId: 'customer-1',
        visitId: 'visit-1',
        items: [
          { productId: 'product-1', quantity: 12 },
          { productId: 'product-2', quantity: 3 },
        ],
      },
      SELLER,
    );

    expect(order.orderNumber).toBeNull();
    expect(order.isPendingSync()).toBe(true);
    expect(order.customerName).toBe('Lubricadora El Pana');
    expect(order.subtotal).toBe(103.35); // 12 × 7.80 + 3 × 3.25
    expect(order.taxTotal).toBe(15.5); // 14.04 + 1.46
    expect(order.total).toBe(118.85);
    expect(order.items).toHaveLength(2);

    const [operation] = db.select().from(outbox).all();
    expect(operation).toMatchObject({
      idempotencyKey: `order-create-${order.id}`,
      entityType: 'ORDER',
      action: 'CREATE',
    });
    // The server recalculates prices; the app sends what it displayed
    expect(operation.payload).toEqual({
      id: order.id,
      customerId: 'customer-1',
      visitId: 'visit-1',
      items: [
        { productId: 'product-1', quantity: 12, expectedUnitPrice: 7.8 },
        { productId: 'product-2', quantity: 3, expectedUnitPrice: 3.25 },
      ],
    });

    const [listed] = await repository.findAll({ visitId: 'visit-1' });
    expect(listed.items.map((item) => item.productCode)).toEqual(['LUB-001', 'FIL-010']);
  });

  it('only takes orders for ACTIVE customers', async () => {
    insertCustomer(db, { id: 'prospect-1', status: 'PROSPECT' });
    await expect(
      repository.create(
        { customerId: 'prospect-1', items: [{ productId: 'product-1', quantity: 1 }] },
        SELLER,
      ),
    ).rejects.toBeInstanceOf(OrderCustomerNotActiveError);
  });

  it('rejects empty orders and unavailable products without queueing', async () => {
    insertProduct(db, { id: 'product-off', code: 'OFF', isActive: false });

    await expect(
      repository.create({ customerId: 'customer-1', items: [] }, SELLER),
    ).rejects.toBeInstanceOf(OrderEmptyError);
    await expect(
      repository.create(
        { customerId: 'customer-1', items: [{ productId: 'product-off', quantity: 1 }] },
        SELLER,
      ),
    ).rejects.toBeInstanceOf(OrderProductUnavailableError);
    expect(db.select().from(outbox).all()).toHaveLength(0);
  });
});
