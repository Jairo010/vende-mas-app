import { and, asc, eq, gte, inArray, isNull, like, lte, type SQL } from 'drizzle-orm';
import type { ProductEntity } from '@/core/entities/product.entity';
import type { ICatalogRepositoryPort } from '@/core/ports/catalog.repository.port';
import type { Category, ProductFilter, Promotion } from '@/core/types/catalog.types';
import { rankProducts, searchTerms } from '@/core/value-objects/product-search';
import { CatalogRowMapper } from '../mappers/catalog-row.mapper';
import { categories, products, promotions } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

const DEFAULT_PRODUCT_LIMIT = 200;
/** A search ranks at most this many matches (the whole catalog of a distributor fits). */
const MAX_SEARCH_MATCHES = 2000;

export class SqliteCatalogRepository implements ICatalogRepositoryPort {
  private searchTextReady = false;

  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async findProducts(filter: ProductFilter = {}): Promise<ProductEntity[]> {
    this.ensureSearchText();
    const conditions: SQL[] = [eq(products.isActive, true)];
    // Every word must start a word of the product's search text, in any order (ADR 0012).
    const terms = searchTerms(filter.search ?? '');
    for (const term of terms) conditions.push(like(products.searchText, `% ${term}%`));
    if (filter.categoryId) conditions.push(eq(products.categoryId, filter.categoryId));

    const limit = filter.limit ?? DEFAULT_PRODUCT_LIMIT;
    const rows = this.ctx
      .db()
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(asc(products.name))
      // Ranking needs every match of a search, not only the first ones by name.
      .limit(terms.length > 0 ? MAX_SEARCH_MATCHES : limit)
      .all();
    if (terms.length === 0) return rows.map(CatalogRowMapper.toProduct);

    const ranked = rankProducts(
      rows.map((row) => ({ ...row, searchText: row.searchText ?? '' })),
      terms,
    );
    return ranked.slice(0, limit).map(CatalogRowMapper.toProduct);
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
    return row ? CatalogRowMapper.toProduct(row) : null;
  }

  public async findProductsByIds(ids: readonly string[]): Promise<ProductEntity[]> {
    if (ids.length === 0) return [];
    return this.ctx
      .db()
      .select()
      .from(products)
      .where(inArray(products.id, [...ids]))
      .all()
      .map(CatalogRowMapper.toProduct);
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
