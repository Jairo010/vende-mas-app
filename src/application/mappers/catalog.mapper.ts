import { ProductEntity } from '@/core/entities/product.entity';
import type {
  Category,
  DiscountType,
  Promotion,
  PromotionTargetType,
} from '@/core/types/catalog.types';
import type {
  CategoryResponseDto,
  ProductResponseDto,
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
    });
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
