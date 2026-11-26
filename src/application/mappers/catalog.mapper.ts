import { ProductEntity } from '@/core/entities/product.entity';
import {
  type Category,
  type DiscountType,
  FILTER_TYPES,
  OIL_TYPES,
  PAD_MATERIALS,
  PRODUCT_FAMILIES,
  PRODUCT_POSITIONS,
  PRODUCT_PRESENTATIONS,
  type ProductSaleSheet,
  type Promotion,
  type PromotionTargetType,
} from '@/core/types/catalog.types';
import type {
  CategoryResponseDto,
  ProductResponseDto,
  ProductSaleSheetDto,
  PromotionResponseDto,
} from '@/infrastructure/api/dto/catalog.dto';
import { pickEnum } from './enum.mapper';

export class CatalogMapper {
  static toProduct(dto: ProductResponseDto): ProductEntity {
    return ProductEntity.create({
      id: dto.id,
      code: dto.code,
      name: dto.name,
      brand: dto.brand,
      description: dto.description ?? null,
      categoryId: dto.categoryId,
      categoryName: dto.categoryName,
      basePrice: dto.basePrice,
      taxRate: dto.taxRate,
      priceWithTax: dto.priceWithTax,
      unitOfMeasure: dto.unitOfMeasure,
      stockQuantity: dto.stockQuantity,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive,
      ...(dto.saleSheet && { saleSheet: CatalogMapper.toSaleSheet(dto.saleSheet) }),
    });
  }

  /** Values this version does not know are dropped: the product stays, less filterable. */
  static toSaleSheet(dto: ProductSaleSheetDto): ProductSaleSheet {
    const optional = <T extends string>(value: string | null, allowed: readonly T[]): T | null =>
      allowed.find((item) => item === value) ?? null;
    return {
      family: pickEnum(dto.family, PRODUCT_FAMILIES, 'OTHER'),
      position: optional(dto.position, PRODUCT_POSITIONS),
      material: optional(dto.material, PAD_MATERIALS),
      filterType: optional(dto.filterType, FILTER_TYPES),
      viscosity: dto.viscosity,
      oilType: optional(dto.oilType, OIL_TYPES),
      presentation: optional(dto.presentation, PRODUCT_PRESENTATIONS),
      reference: dto.reference,
      fitments: dto.fitments.map((fitment) => ({ ...fitment })),
    };
  }

  static toCategory(dto: CategoryResponseDto): Category {
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      isActive: dto.isActive,
    };
  }

  static toPromotion(dto: PromotionResponseDto): Promotion {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description ?? null,
      discountType: pickEnum<DiscountType>(
        dto.discountType,
        ['PERCENTAGE', 'FIXED_AMOUNT'],
        'PERCENTAGE',
      ),
      discountValue: dto.discountValue,
      targetType: pickEnum<PromotionTargetType>(
        dto.targetType,
        ['GLOBAL', 'CATEGORY', 'PRODUCT'],
        'GLOBAL',
      ),
      targetCategoryId: dto.targetCategoryId ?? null,
      targetProductIds: dto.targetProductIds,
      minQuantity: dto.minQuantity,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
    };
  }
}
