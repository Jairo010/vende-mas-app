import { ProductEntity } from '@/core/entities/product.entity';
import { buildProductSearchText } from '@/core/value-objects/product-search';
import type {
  Category,
  DiscountType,
  FilterType,
  OilType,
  PadMaterial,
  ProductFamily,
  ProductFitment,
  ProductPosition,
  ProductPresentation,
  Promotion,
  PromotionTargetType,
} from '@/core/types/catalog.types';
import type { categories, productFitments, products, promotions } from '../schema';

export type ProductRow = typeof products.$inferSelect;
export type ProductFitmentRow = typeof productFitments.$inferSelect;
export type ProductFitmentInsert = typeof productFitments.$inferInsert;
export type CategoryRow = typeof categories.$inferSelect;
export type PromotionRow = typeof promotions.$inferSelect;

export class CatalogRowMapper {
  /** `fitments`: the product's rows of `product_fitments` (none when they were not loaded). */
  static toProduct(row: ProductRow, fitments: readonly ProductFitment[] = []): ProductEntity {
    const {
      searchText: _searchText,
      family,
      position,
      material,
      filterType,
      viscosity,
      oilType,
      presentation,
      reference,
      ...props
    } = row;
    return ProductEntity.create({
      ...props,
      // The columns hold values the API mapper already checked against the domain lists.
      saleSheet: {
        family: family as ProductFamily,
        position: position as ProductPosition | null,
        material: material as PadMaterial | null,
        filterType: filterType as FilterType | null,
        viscosity,
        oilType: oilType as OilType | null,
        presentation: presentation as ProductPresentation | null,
        reference,
        fitments: fitments.map((fitment) => ({
          make: fitment.make,
          model: fitment.model,
          yearFrom: fitment.yearFrom,
          yearTo: fitment.yearTo,
        })),
      },
    });
  }

  static fromProduct(entity: ProductEntity): ProductRow {
    const sheet = entity.saleSheet;
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
      searchText: buildProductSearchText(entity),
      family: sheet.family,
      position: sheet.position,
      material: sheet.material,
      filterType: sheet.filterType,
      viscosity: sheet.viscosity,
      oilType: sheet.oilType,
      presentation: sheet.presentation,
      reference: sheet.reference,
    };
  }

  static toFitmentRows(entity: ProductEntity): ProductFitmentInsert[] {
    return entity.saleSheet.fitments.map((fitment) => ({ productId: entity.id, ...fitment }));
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
