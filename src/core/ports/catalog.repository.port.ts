import type { ProductEntity } from '../entities/product.entity';
import type { Category, ProductFilter, Promotion } from '../types/catalog.types';

/** Read-only catalog downloaded by the sync (products, categories, promotions). */
export interface ICatalogRepositoryPort {
  findProducts(filter?: ProductFilter): Promise<ProductEntity[]>;
  findProductById(id: string): Promise<ProductEntity | null>;
  findCategories(): Promise<Category[]>;
  /** Promotions valid at `at` (defaults to now). */
  findActivePromotions(at?: Date): Promise<Promotion[]>;
}
