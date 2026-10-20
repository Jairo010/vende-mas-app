import { and, asc, eq, gte, inArray, like, lte, or, type SQL } from 'drizzle-orm';
import type { ProductEntity } from '@/core/entities/product.entity';
import type { ICatalogRepositoryPort } from '@/core/ports/catalog.repository.port';
import type { Category, ProductFilter, Promotion } from '@/core/types/catalog.types';
import { CatalogRowMapper } from '../mappers/catalog-row.mapper';
import { categories, products, promotions } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

const DEFAULT_PRODUCT_LIMIT = 200;

export class SqliteCatalogRepository implements ICatalogRepositoryPort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async findProducts(filter: ProductFilter = {}): Promise<ProductEntity[]> {
    const conditions: SQL[] = [eq(products.isActive, true)];
    const term = filter.search?.trim();
    if (term) {
      const pattern = `%${term}%`;
      conditions.push(
        or(
          like(products.name, pattern),
          like(products.code, pattern),
          like(products.brand, pattern),
        ) as SQL,
      );
    }
    if (filter.categoryId) conditions.push(eq(products.categoryId, filter.categoryId));

    return this.ctx
      .db()
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(asc(products.name))
      .limit(filter.limit ?? DEFAULT_PRODUCT_LIMIT)
      .all()
      .map(CatalogRowMapper.toProduct);
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
