import { SqliteCatalogRepository } from '@/infrastructure/database/repositories/sqlite-catalog.repository';
import { products } from '@/infrastructure/database/schema';
import type { AppDatabase } from '@/infrastructure/database/database.types';
import { createTestContext, createTestDatabase } from '../../helpers/test-database';
import { insertProduct } from '../../helpers/fixtures';

describe('SqliteCatalogRepository search', () => {
  let db: AppDatabase;
  let repository: SqliteCatalogRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repository = new SqliteCatalogRepository(createTestContext(db));
    // Rows written without search text, as downloaded before it existed.
    insertProduct(db, {
      id: 'oil',
      code: 'FR-LU-GE-2400',
      name: 'LTR QUARTZ 5000 SN 20W50 TOTAL MINERAL II',
      brand: 'TOTAL',
      categoryName: 'LIQUIDOS, LUBRICANTES',
    });
    insertProduct(db, {
      id: 'pads-out',
      code: 'FR-KS-CH-2481',
      name: 'D1321 - CHEVROLET SPARK LT/LS',
      categoryName: 'PASTILLAS DE FRENO CARBON CERAMICA',
      stockQuantity: 0,
    });
    insertProduct(db, {
      id: 'pads',
      code: 'FR-KS-CH-2480',
      name: 'GDB3195CX5 D1321 CHEVROLET SPARK TODOS RD',
      categoryName: 'PASTILLAS DE FRENO CARBON CERAMICA',
      stockQuantity: 8,
    });
  });

  it('finds products the way customers ask, in stock first', async () => {
    expect((await repository.findProducts({ search: 'pastillas spark' })).map((p) => p.id)).toEqual(
      ['pads', 'pads-out'],
    );
    expect(
      (await repository.findProducts({ search: 'aceite total 20w50' })).map((p) => p.id),
    ).toEqual(['oil']);
    expect(await repository.findProducts({ search: 'pastillas hilux' })).toEqual([]);
  });

  it('indexes the products downloaded before the search existed, once', async () => {
    await repository.findProducts({ search: 'spark' });

    const rows = db
      .select({ id: products.id, searchText: products.searchText })
      .from(products)
      .all();
    expect(rows.every((row) => row.searchText?.includes(' spark') || row.id === 'oil')).toBe(true);
    expect(rows.find((row) => row.id === 'oil')?.searchText).toContain(' aceite ');
  });

  it('lists the whole catalog by name without a search', async () => {
    expect((await repository.findProducts()).map((p) => p.id)).toEqual(['pads-out', 'pads', 'oil']);
  });
});
