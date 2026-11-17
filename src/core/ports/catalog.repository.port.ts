import type { ProductEntity } from '../entities/product.entity';
import type {
  Category,
  ProductFacets,
  ProductFamily,
  ProductFilter,
  Promotion,
  VehicleMakeOption,
} from '../types/catalog.types';

/** Read-only catalog downloaded by the sync (products, categories, promotions). */
export interface ICatalogRepositoryPort {
  findProducts(filter?: ProductFilter): Promise<ProductEntity[]>;
  /** What each filter can still take given the others, with counts (ADR 0021). */
  findFacets(filter?: ProductFilter): Promise<ProductFacets>;
  /** Makes and models the catalog (or one family) fits, most products first. */
  findVehicleMakes(family?: ProductFamily): Promise<VehicleMakeOption[]>;
  findProductById(id: string): Promise<ProductEntity | null>;
  /** Products of a cart (inactive ones included, so the cart can flag them). */
  findProductsByIds(ids: readonly string[]): Promise<ProductEntity[]>;
  findCategories(): Promise<Category[]>;
  /** Promotions valid at `at` (defaults to now). */
  findActivePromotions(at?: Date): Promise<Promotion[]>;
}
