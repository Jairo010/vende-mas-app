import { customers, products } from '@/infrastructure/database/schema';
import type { AppDatabase } from '@/infrastructure/database/database.types';

type CustomerInsert = typeof customers.$inferInsert;
type ProductInsert = typeof products.$inferInsert;

export const SELLER = { userId: 'seller-1', userName: 'Carlos Mendoza' };

export function insertCustomer(db: AppDatabase, overrides: Partial<CustomerInsert> = {}) {
  const row: CustomerInsert = {
    id: 'customer-1',
    status: 'ACTIVE',
    tradeName: 'Lubricadora El Pana',
    businessName: 'Lubricantes Pérez Cía. Ltda.',
    identificationType: 'RUC',
    identification: '1712345675001',
    address: 'Av. Maldonado S12-45, Quito',
    email: 'facturacion@elpana.ec',
    latitude: -0.2799,
    longitude: -78.5446,
    storePhotoUrl: '/api/v1/files/photos/store.jpg',
    assignedSellerId: SELLER.userId,
    billingSyncStatus: 'EXPORTED',
    isActive: true,
    syncStatus: 'SYNCED',
    createdAt: '2026-10-01T15:00:00.000Z',
    updatedAt: '2026-10-01T15:00:00.000Z',
    ...overrides,
  };
  db.insert(customers).values(row).run();
  return row;
}

export function insertProduct(db: AppDatabase, overrides: Partial<ProductInsert> = {}) {
  const row: ProductInsert = {
    id: 'product-1',
    code: 'LUB-001',
    name: 'Aceite Castrol GTX 20W-50 1/4 gal',
    brand: 'Castrol',
    categoryId: 'category-1',
    categoryName: 'Aceites',
    basePrice: 7.8,
    taxRate: 0.15,
    priceWithTax: 8.97,
    unitOfMeasure: 'UNIT',
    stockQuantity: 100,
    isActive: true,
    ...overrides,
  };
  db.insert(products).values(row).run();
  return row;
}
