/** Wire format of the API catalog and promotions modules (delivered by sync pull). */

export interface ProductFitmentDto {
  make: string;
  model: string | null;
  yearFrom: number | null;
  yearTo: number | null;
}

/** Values are the lists of the API's sale sheet (ADR 0045), as text. */
export interface ProductSaleSheetDto {
  family: string;
  position: string | null;
  material: string | null;
  filterType: string | null;
  viscosity: string | null;
  oilType: string | null;
  presentation: string | null;
  reference: string | null;
  fitments: ProductFitmentDto[];
}

export interface ProductResponseDto {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  taxRate: number;
  priceWithTax: number;
  description?: string | null;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  unitOfMeasure: string;
  stockQuantity: number;
  isOutOfStock: boolean;
  imageUrl?: string | null;
  isActive: boolean;
  /** Absent on servers before sale sheets. */
  saleSheet?: ProductSaleSheetDto;
}

export interface CategoryResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface PromotionResponseDto {
  id: string;
  name: string;
  description?: string | null;
  discountType: string;
  discountValue: number;
  targetType: string;
  targetCategoryId?: string | null;
  targetProductIds: string[];
  minQuantity: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
