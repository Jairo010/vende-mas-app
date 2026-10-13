import { ProductEntity } from '@/core/entities/product.entity';
import type {
  Category,
  DiscountType,
  Promotion,
  PromotionTargetType,
} from '@/core/types/catalog.types';
import type { categories, products, promotions } from '../schema';

export type ProductRow = typeof products.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type PromotionRow = typeof promotions.$inferSelect;

export class CatalogRowMapper {
  static toProduct(row: ProductRow): ProductEntity {
    return ProductEntity.create({ ...row });
  }

  static fromProduct(entity: ProductEntity): ProductRow {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      brand: entity.brand,
      description: entity.description,
      categoryId: entity.categoryId,
      categoryName: entity.categoryName,
      basePrice: entity.basePrice,
      taxRate: entity.taxRate,
      priceWithTax: entity.priceWithTax,
      unitOfMeasure: entity.unitOfMeasure,
      stockQuantity: entity.stockQuantity,
      imageUrl: entity.imageUrl,
      isActive: entity.isActive,
    };
  }

  static toCategory(row: CategoryRow): Category {
    return { ...row };
  }

  static toPromotion(row: PromotionRow): Promotion {
    return {
      ...row,
      discountType: row.discountType as DiscountType,
      targetType: row.targetType as PromotionTargetType,
    };
  }
}
