import {
  and,
  asc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  like,
  lte,
  notInArray,
  or,
  type SQL,
} from 'drizzle-orm';
import type { ProductEntity } from '@/core/entities/product.entity';
import type { ICatalogRepositoryPort } from '@/core/ports/catalog.repository.port';
import {
  LIQUID_FAMILIES,
  PRODUCT_FAMILIES,
  type Category,
  type FacetOption,
  type ProductFacets,
  type ProductFamily,
  type ProductFilter,
  type Promotion,
  type SaleVehicle,
  type VehicleMakeOption,
} from '@/core/types/catalog.types';
import { rankProducts, searchTerms } from '@/core/value-objects/product-search';
import { CatalogRowMapper, type ProductFitmentRow } from '../mappers/catalog-row.mapper';
import { categories, productFitments, products, promotions } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

const DEFAULT_PRODUCT_LIMIT = 200;
/** A search ranks at most this many matches (the whole catalog of a distributor fits). */
const MAX_SEARCH_MATCHES = 2000;
/** SQLite takes a limited number of values per statement. */
const ID_CHUNK = 400;

/** Attribute filters: each one can be left out to count what its own options would leave. */
const ATTRIBUTE_KEYS = [
  'position',
  'material',
  'filterType',
  'viscosity',
  'oilType',
  'presentation',
  'brand',
] as const;
type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

/** The columns the facets are counted from. */
interface FacetRow {
  family: string;
  position: string | null;
  material: string | null;
  filterType: string | null;
  viscosity: string | null;
  oilType: string | null;
  presentation: string | null;
  brand: string | null;
}

const vehicleApplies = (
  filter: ProductFilter,
): filter is ProductFilter & { vehicle: SaleVehicle } =>
  filter.vehicle !== undefined && !(filter.family && LIQUID_FAMILIES.includes(filter.family));

function countBy<T extends string>(
  rows: readonly FacetRow[],
  key: keyof FacetRow,
): FacetOption<T>[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row[key];
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts]
    .map(([value, count]) => ({ value: value as T, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export class SqliteCatalogRepository implements ICatalogRepositoryPort {
  private searchTextReady = false;

  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async findProducts(filter: ProductFilter = {}): Promise<ProductEntity[]> {
    this.ensureSearchText();
    const terms = searchTerms(filter.search ?? '');
    const limit = filter.limit ?? DEFAULT_PRODUCT_LIMIT;
    const rows = this.ctx
      .db()
      .select()
      .from(products)
      .where(and(...this.conditions(filter, terms)))
      .orderBy(asc(products.name))
      // Ranking needs every match of a search, not only the first ones by name.
      .limit(terms.length > 0 ? MAX_SEARCH_MATCHES : limit)
      .all();

    const page =
      terms.length === 0
        ? rows
        : rankProducts(
            rows.map((row) => ({ ...row, searchText: row.searchText ?? '' })),
            terms,
          ).slice(0, limit);
    const fitments = this.fitmentsOf(page.map((row) => row.id));
    return page.map((row) => CatalogRowMapper.toProduct(row, fitments.get(row.id)));
  }

  /**
   * Every filter is counted without itself (ADR 0021): choosing "Delantera" must not empty the
   * list of positions, only narrow the other filters.
   */
  public async findFacets(filter: ProductFilter = {}): Promise<ProductFacets> {
    this.ensureSearchText();
    const terms = searchTerms(filter.search ?? '');
    const select = (conditions: SQL[]): FacetRow[] =>
      this.ctx
        .db()
        .select({
          family: products.family,
          position: products.position,
          material: products.material,
          filterType: products.filterType,
          viscosity: products.viscosity,
          oilType: products.oilType,
          presentation: products.presentation,
          brand: products.brand,
        })
        .from(products)
        .where(and(...conditions))
        .all();

    // The families are counted over the search, the vehicle and the stock only.
    const { family: _family, ...beyondFamily } = filter;
    for (const key of ATTRIBUTE_KEYS) delete beyondFamily[key];
    const familyRows = select(this.conditions(beyondFamily, terms));

    // Inside the family: all its rows, narrowed in memory once per facet.
    const withoutAttributes: ProductFilter = { ...filter };
    for (const key of ATTRIBUTE_KEYS) delete withoutAttributes[key];
    const rows = select(this.conditions(withoutAttributes, terms));
    const matches = (row: FacetRow, skip?: AttributeKey): boolean =>
      ATTRIBUTE_KEYS.every((key) => key === skip || !filter[key] || row[key] === filter[key]);
    const facet = <T extends string>(key: AttributeKey): FacetOption<T>[] =>
      countBy<T>(
        rows.filter((row) => matches(row, key)),
        key,
      );

    const families = countBy<ProductFamily>(familyRows, 'family');
    return {
      total: rows.filter((row) => matches(row)).length,
      families: PRODUCT_FAMILIES.flatMap((family) => families.filter((f) => f.value === family)),
      positions: facet('position'),
      materials: facet('material'),
      filterTypes: facet('filterType'),
      viscosities: facet('viscosity'),
      oilTypes: facet('oilType'),
      presentations: facet('presentation'),
      brands: facet('brand'),
    };
  }

  public async findVehicleMakes(family?: ProductFamily): Promise<VehicleMakeOption[]> {
    const rows = this.ctx
      .db()
      .select({
        productId: productFitments.productId,
        make: productFitments.make,
        model: productFitments.model,
      })
      .from(productFitments)
      .innerJoin(products, eq(products.id, productFitments.productId))
      .where(and(eq(products.isActive, true), ...(family ? [eq(products.family, family)] : [])))
      .all();

    const makes = new Map<string, { products: Set<string>; models: Map<string, Set<string>> }>();
    for (const row of rows) {
      const entry = makes.get(row.make) ?? { products: new Set(), models: new Map() };
      entry.products.add(row.productId);
      if (row.model) {
        const ofModel = entry.models.get(row.model) ?? new Set<string>();
        ofModel.add(row.productId);
        entry.models.set(row.model, ofModel);
      }
      makes.set(row.make, entry);
    }
    return [...makes]
      .map(([make, entry]) => ({
        make,
        count: entry.products.size,
        models: [...entry.models]
          .map(([model, ofModel]) => ({ model, count: ofModel.size }))
          .sort((a, b) => b.count - a.count || a.model.localeCompare(b.model)),
      }))
      .sort((a, b) => b.count - a.count || a.make.localeCompare(b.make));
  }

  private conditions(filter: ProductFilter, terms: readonly string[]): SQL[] {
    const conditions: SQL[] = [eq(products.isActive, true)];
    // Every word must start a word of the product's search text, in any order (ADR 0012).
    for (const term of terms) conditions.push(like(products.searchText, `% ${term}%`));
    if (filter.categoryId) conditions.push(eq(products.categoryId, filter.categoryId));
    if (filter.family) conditions.push(eq(products.family, filter.family));
    if (filter.position) conditions.push(eq(products.position, filter.position));
    if (filter.material) conditions.push(eq(products.material, filter.material));
    if (filter.filterType) conditions.push(eq(products.filterType, filter.filterType));
    if (filter.viscosity) conditions.push(eq(products.viscosity, filter.viscosity));
    if (filter.oilType) conditions.push(eq(products.oilType, filter.oilType));
    if (filter.presentation) conditions.push(eq(products.presentation, filter.presentation));
    if (filter.brand) conditions.push(eq(products.brand, filter.brand));
    if (filter.inStockOnly) conditions.push(gt(products.stockQuantity, 0));
    if (vehicleApplies(filter)) {
      conditions.push(inArray(products.id, this.fitting(filter.vehicle)));
      // Without a family, the liquids would only be noise next to the parts of the vehicle.
      if (!filter.family) conditions.push(notInArray(products.family, [...LIQUID_FAMILIES]));
    }
    return conditions;
  }

  /** Products with a fitment for the vehicle; what a fitment leaves open (model, years) fits. */
  private fitting(vehicle: SaleVehicle) {
    const conditions: (SQL | undefined)[] = [eq(productFitments.make, vehicle.make)];
    if (vehicle.model !== null) {
      conditions.push(or(eq(productFitments.model, vehicle.model), isNull(productFitments.model)));
    }
    if (vehicle.year !== null) {
      conditions.push(
        or(isNull(productFitments.yearFrom), lte(productFitments.yearFrom, vehicle.year)),
        or(isNull(productFitments.yearTo), gte(productFitments.yearTo, vehicle.year)),
      );
    }
    return this.ctx
      .db()
      .select({ productId: productFitments.productId })
      .from(productFitments)
      .where(and(...conditions));
  }

  private fitmentsOf(ids: readonly string[]): Map<string, ProductFitmentRow[]> {
    const byProduct = new Map<string, ProductFitmentRow[]>();
    for (let start = 0; start < ids.length; start += ID_CHUNK) {
      const rows = this.ctx
        .db()
        .select()
        .from(productFitments)
        .where(inArray(productFitments.productId, ids.slice(start, start + ID_CHUNK)))
        .orderBy(asc(productFitments.make), asc(productFitments.model))
        .all();
      for (const row of rows) {
        const list = byProduct.get(row.productId) ?? [];
        list.push(row);
        byProduct.set(row.productId, list);
      }
    }
    return byProduct;
  }

  /**
   * Products downloaded before the search text existed get it once (later pulls write it with
   * every product).
   */
  private ensureSearchText(): void {
    if (this.searchTextReady) return;
    const stale = this.ctx.db().select().from(products).where(isNull(products.searchText)).all();
    if (stale.length > 0) {
      this.ctx.db().transaction((tx) => {
        for (const row of stale) {
          const { searchText } = CatalogRowMapper.fromProduct(CatalogRowMapper.toProduct(row));
          tx.update(products).set({ searchText }).where(eq(products.id, row.id)).run();
        }
      });
    }
    this.searchTextReady = true;
  }

  public async findProductById(id: string): Promise<ProductEntity | null> {
    const row = this.ctx.db().select().from(products).where(eq(products.id, id)).get();
    return row ? CatalogRowMapper.toProduct(row, this.fitmentsOf([id]).get(id)) : null;
  }

  public async findProductsByIds(ids: readonly string[]): Promise<ProductEntity[]> {
    if (ids.length === 0) return [];
    const fitments = this.fitmentsOf(ids);
    return this.ctx
      .db()
      .select()
      .from(products)
      .where(inArray(products.id, [...ids]))
      .all()
      .map((row) => CatalogRowMapper.toProduct(row, fitments.get(row.id)));
  }

  public async findCategories(): Promise<Category[]> {
    return this.ctx
      .db()
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.name))
      .all()
      .map(CatalogRowMapper.toCategory);
  }

  public async findActivePromotions(at: Date = this.ctx.now()): Promise<Promotion[]> {
    const instant = at.toISOString();
    return this.ctx
      .db()
      .select()
      .from(promotions)
      .where(and(lte(promotions.startsAt, instant), gte(promotions.endsAt, instant)))
      .all()
      .map(CatalogRowMapper.toPromotion);
  }
}

export const sqliteCatalogRepository = new SqliteCatalogRepository();
