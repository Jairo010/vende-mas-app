import { ProductEntity } from '@/core/entities/product.entity';
import { fitsVehicle, type ProductSaleSheet } from '@/core/types/catalog.types';
import {
  attributesOf,
  fitmentLabel,
  hasActiveFilters,
  productFitLine,
  vehicleLabel,
  withFamily,
} from '@/presentation/features/orders/sale-filters';

function product(saleSheet: Partial<ProductSaleSheet>): ProductEntity {
  return ProductEntity.create({
    id: 'product-1',
    code: 'FR-1',
    name: 'D1321',
    brand: 'KLASS',
    description: null,
    categoryId: 'category-1',
    categoryName: 'PASTILLAS',
    basePrice: 10,
    taxRate: 0.15,
    priceWithTax: 11.5,
    unitOfMeasure: 'Unidad',
    stockQuantity: 3,
    imageUrl: null,
    isActive: true,
    saleSheet: {
      family: 'BRAKE_PAD',
      position: null,
      material: null,
      filterType: null,
      viscosity: null,
      oilType: null,
      presentation: null,
      reference: null,
      fitments: [],
      ...saleSheet,
    },
  });
}

describe('sale filters', () => {
  it('names vehicles and fitments the way sellers say them', () => {
    expect(vehicleLabel({ make: 'Chevrolet', model: 'Spark', year: 2015 })).toBe('Spark 2015');
    expect(vehicleLabel({ make: 'Chevrolet', model: null, year: null })).toBe('Chevrolet');
    expect(fitmentLabel({ make: 'Chevrolet', model: 'Spark', yearFrom: 2008, yearTo: 2015 })).toBe(
      'Spark 2008-2015',
    );
    expect(fitmentLabel({ make: 'Toyota', model: 'Hilux', yearFrom: 2006, yearTo: null })).toBe(
      'Hilux desde 2006',
    );
    expect(fitmentLabel({ make: 'Kia', model: 'Rio', yearFrom: null, yearTo: 2016 })).toBe(
      'Rio hasta 2016',
    );
    expect(fitmentLabel({ make: 'Hino', model: null, yearFrom: null, yearTo: null })).toBe('Hino');
  });

  it('treats what a fitment leaves open as fitting', () => {
    const spark = { make: 'Chevrolet', model: 'Spark', yearFrom: 2008, yearTo: 2015 };

    expect(fitsVehicle(spark, { make: 'Chevrolet', model: 'Spark', year: 2012 })).toBe(true);
    expect(fitsVehicle(spark, { make: 'Chevrolet', model: 'Spark', year: 2018 })).toBe(false);
    expect(fitsVehicle(spark, { make: 'Chevrolet', model: null, year: null })).toBe(true);
    expect(fitsVehicle(spark, { make: 'Chevrolet', model: 'Aveo', year: null })).toBe(false);
    expect(
      fitsVehicle(
        { make: 'Chevrolet', model: null, yearFrom: null, yearTo: null },
        { make: 'Chevrolet', model: 'Aveo', year: 2010 },
      ),
    ).toBe(true);
  });

  it('shows on a product what it fits, for the chosen vehicle first', () => {
    const pad = product({
      position: 'FRONT',
      fitments: [
        { make: 'Hyundai', model: 'Tucson', yearFrom: 2017, yearTo: null },
        { make: 'Kia', model: 'Sportage', yearFrom: 2017, yearTo: null },
        { make: 'Kia', model: 'Carens', yearFrom: null, yearTo: null },
      ],
    });

    expect(productFitLine(pad, null)).toBe(
      'Tucson desde 2017, Sportage desde 2017, +1 más · Delantera',
    );
    expect(productFitLine(pad, { make: 'Kia', model: 'Carens', year: 2012 })).toBe(
      'Carens · Delantera',
    );
    expect(productFitLine(product({}), null)).toBe('');
  });

  it('offers the filters of each family and drops them when the family changes', () => {
    expect(attributesOf('OIL')).toEqual(['viscosity', 'oilType', 'presentation', 'brand']);
    expect(attributesOf(undefined)).toEqual(['brand']);
    expect(
      withFamily({ family: 'BRAKE_PAD', position: 'FRONT', inStockOnly: true }, 'OIL'),
    ).toEqual({ family: 'OIL', inStockOnly: true });
    expect(hasActiveFilters({}, null)).toBe(false);
    expect(hasActiveFilters({}, { make: 'Kia', model: null, year: null })).toBe(true);
    expect(hasActiveFilters({ inStockOnly: true }, null)).toBe(true);
  });
});
