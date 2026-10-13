export interface ProductFilter {
  /** Matches code, name or brand. */
  search?: string;
  categoryId?: string;
  limit?: number;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type PromotionTargetType = 'GLOBAL' | 'CATEGORY' | 'PRODUCT';

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  targetType: PromotionTargetType;
  targetCategoryId: string | null;
  targetProductIds: string[];
  minQuantity: number;
  startsAt: string;
  endsAt: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}
