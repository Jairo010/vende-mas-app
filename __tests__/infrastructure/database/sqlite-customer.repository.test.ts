import { SqliteCustomerRepository } from '@/infrastructure/database/repositories/sqlite-customer.repository';
import { outbox, pendingPhotos } from '@/infrastructure/database/schema';
import type { AppDatabase } from '@/infrastructure/database/database.types';
import { CustomerAlreadyActiveError } from '@/core/errors/customer.errors';
import { createTestContext, createTestDatabase } from '../../helpers/test-database';
import { insertCustomer, SELLER } from '../../helpers/fixtures';

describe('SqliteCustomerRepository', () => {
  let db: AppDatabase;
  let repository: SqliteCustomerRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repository = new SqliteCustomerRepository(createTestContext(db));
  });

  it('creates a prospect with only a reference, assigned to the seller', async () => {
    const prospect = await repository.create(
      { tradeName: '  Taller frente al parque  ', latitude: -0.2, longitude: -78.5 },
      SELLER,
    );

    expect(prospect.isProspect()).toBe(true);
    expect(prospect.tradeName).toBe('Taller frente al parque');
    expect(prospect.assignedSellerId).toBe(SELLER.userId);
    expect(prospect.syncStatus).toBe('PENDING');

    const [operation] = db.select().from(outbox).all();
    expect(operation.action).toBe('CREATE');
    expect(operation.payload).toEqual({
      id: prospect.id,
      status: 'PROSPECT',
      tradeName: 'Taller frente al parque',
      latitude: -0.2,
      longitude: -78.5,
    });
  });

  it('queues the store photo for upload and injects it as storePhotoUrl', async () => {
    const created = await repository.create(
      { tradeName: 'Lubricadora Norte', storePhotoLocalUri: 'file:///photo.jpg' },
      SELLER,
    );

    expect(created.hasStorePhoto()).toBe(true);
    const [photo] = db.select().from(pendingPhotos).all();
    const [operation] = db.select().from(outbox).all();
    expect(operation).toMatchObject({ photoId: photo.id, photoField: 'storePhotoUrl' });
  });

  it('promotes a prospect to ACTIVE with billing data, only once', async () => {
    insertCustomer(db, { id: 'prospect-1', status: 'PROSPECT', businessName: null });

    const active = await repository.promote('prospect-1', {
      businessName: 'Lubricantes Pérez Cía. Ltda.',
      identificationType: 'RUC',
      identification: '1712345675001',
      address: 'Av. Maldonado S12-45',
      email: 'facturacion@elpana.ec',
    });

    expect(active.status).toBe('ACTIVE');
    expect(active.canTakeOrders()).toBe(true);
    expect(active.billingSyncStatus).toBe('PENDING');
    await expect(
      repository.promote('prospect-1', {
        businessName: 'x',
        identificationType: 'RUC',
        identification: '1',
        address: 'x',
        email: 'a@b.ec',
      }),
    ).rejects.toBeInstanceOf(CustomerAlreadyActiveError);
  });

  it('searches by name or identification and filters by status', async () => {
    insertCustomer(db, {
      id: 'c1',
      tradeName: 'Lubricadora El Pana',
      identification: '1712345675001',
    });
    insertCustomer(db, { id: 'c2', tradeName: 'Repuestos Andrade', identification: '0912345678' });
    insertCustomer(db, { id: 'c3', tradeName: 'Taller Pana Car', status: 'PROSPECT' });
    insertCustomer(db, { id: 'c4', tradeName: 'Inactivo Pana', isActive: false });

    expect((await repository.search({ search: 'pana' })).map((c) => c.id)).toEqual(['c1', 'c3']);
    expect((await repository.search({ search: '0912' })).map((c) => c.id)).toEqual(['c2']);
    expect((await repository.search({ status: 'PROSPECT' })).map((c) => c.id)).toEqual(['c3']);
  });

  it('updates only the provided fields', async () => {
    insertCustomer(db, { id: 'c1', phone: '0991111111' });

    const updated = await repository.update('c1', { phone: '0992222222', contactName: null });

    expect(updated.phone).toBe('0992222222');
    expect(updated.tradeName).toBe('Lubricadora El Pana');
    const [operation] = db.select().from(outbox).all();
    expect(operation.payload).toEqual({ phone: '0992222222', contactName: null });
    expect(operation.idempotencyKey).toMatch(/^customer-update-c1-/);
  });
});
