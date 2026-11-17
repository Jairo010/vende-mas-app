import { SqliteCatalogRepository } from '@/infrastructure/database/repositories/sqlite-catalog.repository';
import { productFitments } from '@/infrastructure/database/schema';
import type { AppDatabase } from '@/infrastructure/database/database.types';
import { createTestContext, createTestDatabase } from '../../helpers/test-database';
import { insertProduct } from '../../helpers/fixtures';

const PADS = 'PASTILLAS DE FRENO CARBON CERAMICA';

describe('SqliteCatalogRepository sale filters (ADR 0021)', () => {
  let db: AppDatabase;
  let repository: SqliteCatalogRepository;
  const ids = async (filter: Parameters<SqliteCatalogRepository['findProducts']>[0]) =>
    (await repository.findProducts(filter)).map((product) => product.id).sort();

  beforeEach(async () => {
    db = await createTestDatabase();
    repository = new SqliteCatalogRepository(createTestContext(db));
    insertProduct(db, {
      id: 'spark-front',
      name: 'D1321 CHEVROLET SPARK RD',
      brand: 'KLASS',
      categoryName: PADS,
      family: 'BRAKE_PAD',
      position: 'FRONT',
    });
    insertProduct(db, {
      id: 'spark-rear',
      name: 'D1500 CHEVROLET SPARK POST',
      brand: 'FRENEC',
      categoryName: PADS,
      family: 'BRAKE_PAD',
      position: 'REAR',
      stockQuantity: 0,
    });
    insertProduct(db, {
      id: 'chevrolet-any',
      name: 'FILTRO DE ACEITE CHEVROLET',
      brand: 'ADVANCE',
      categoryName: 'FILTROS',
      family: 'FILTER',
      filterType: 'OIL',
    });
    insertProduct(db, {
      id: 'hilux-front',
      name: 'D799 TOYOTA HILUX RD',
      brand: 'KLASS',
      categoryName: PADS,
      family: 'BRAKE_PAD',
      position: 'FRONT',
    });
    insertProduct(db, {
      id: 'oil',
      name: 'GLN 20W50 MINERAL',
      brand: 'GULF',
      categoryName: 'LIQUIDOS',
      family: 'OIL',
      viscosity: '20W50',
      presentation: 'GALLON',
    });
    db.insert(productFitments)
      .values([
        {
          productId: 'spark-front',
          make: 'Chevrolet',
          model: 'Spark',
          yearFrom: 2008,
          yearTo: 2015,
        },
        {
          productId: 'spark-rear',
          make: 'Chevrolet',
          model: 'Spark',
          yearFrom: null,
          yearTo: null,
        },
        {
          productId: 'chevrolet-any',
          make: 'Chevrolet',
          model: null,
          yearFrom: null,
          yearTo: null,
        },
        { productId: 'hilux-front', make: 'Toyota', model: 'Hilux', yearFrom: 2006, yearTo: null },
      ])
      .run();
  });

  it('filters by family and its attributes, and by stock', async () => {
    expect(await ids({ family: 'BRAKE_PAD' })).toEqual([
      'hilux-front',
      'spark-front',
      'spark-rear',
    ]);
    expect(await ids({ family: 'BRAKE_PAD', position: 'FRONT', brand: 'KLASS' })).toEqual([
      'hilux-front',
      'spark-front',
    ]);
    expect(await ids({ family: 'BRAKE_PAD', inStockOnly: true })).toEqual([
      'hilux-front',
      'spark-front',
    ]);
    expect(await ids({ family: 'OIL', viscosity: '20W50' })).toEqual(['oil']);
  });

  it('filters by vehicle: what a fitment leaves open (model, years) fits', async () => {
    const spark = { make: 'Chevrolet', model: 'Spark', year: null };

    expect(await ids({ vehicle: spark })).toEqual(['chevrolet-any', 'spark-front', 'spark-rear']);
    // 2018 is past the front pads (2008-2015); the rear ones give no years.
    expect(await ids({ vehicle: { ...spark, year: 2018 } })).toEqual([
      'chevrolet-any',
      'spark-rear',
    ]);
    expect(await ids({ vehicle: { make: 'Toyota', model: 'Hilux', year: 2020 } })).toEqual([
      'hilux-front',
    ]);
    expect(await ids({ vehicle: { make: 'Toyota', model: 'Hilux', year: 2000 } })).toEqual([]);
  });

  it('keeps the liquids when their family is chosen, whatever the vehicle', async () => {
    const vehicle = { make: 'Chevrolet', model: 'Spark', year: 2012 };

    expect(await ids({ vehicle, family: 'OIL' })).toEqual(['oil']);
    expect(await ids({ vehicle })).not.toContain('oil');
  });

  it('returns each product with its fitments and combines filters with the search', async () => {
    const [pad] = await repository.findProducts({ search: 'spark', position: 'FRONT' });

    expect(pad.id).toBe('spark-front');
    expect(pad.saleSheet).toMatchObject({
      family: 'BRAKE_PAD',
      position: 'FRONT',
      fitments: [{ make: 'Chevrolet', model: 'Spark', yearFrom: 2008, yearTo: 2015 }],
    });
  });

  it('counts what every filter would leave, without counting the filter itself', async () => {
    const facets = await repository.findFacets({ family: 'BRAKE_PAD', position: 'FRONT' });

    expect(facets.total).toBe(2);
    // Choosing "front" does not hide "rear" from its own list.
    expect(facets.positions).toEqual([
      { value: 'FRONT', count: 2 },
      { value: 'REAR', count: 1 },
    ]);
    expect(facets.brands).toEqual([{ value: 'KLASS', count: 2 }]);
    expect(facets.families).toEqual([
      { value: 'BRAKE_PAD', count: 3 },
      { value: 'FILTER', count: 1 },
      { value: 'OIL', count: 1 },
    ]);

    const forSpark = await repository.findFacets({
      vehicle: { make: 'Chevrolet', model: 'Spark', year: null },
    });
    expect(forSpark.families).toEqual([
      { value: 'BRAKE_PAD', count: 2 },
      { value: 'FILTER', count: 1 },
    ]);
  });

  it('lists the makes and models of the catalog, or of one family', async () => {
    expect(await repository.findVehicleMakes()).toEqual([
      { make: 'Chevrolet', count: 3, models: [{ model: 'Spark', count: 2 }] },
      { make: 'Toyota', count: 1, models: [{ model: 'Hilux', count: 1 }] },
    ]);
    expect(await repository.findVehicleMakes('FILTER')).toEqual([
      { make: 'Chevrolet', count: 1, models: [] },
    ]);
  });
});
