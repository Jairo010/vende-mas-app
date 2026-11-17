/** Lists of the API's sale sheet (API ADR 0045). Unknown values from a newer server fall back. */
export const PRODUCT_FAMILIES = [
  'BRAKE_PAD',
  'BRAKE_SHOE',
  'BRAKE_DISC',
  'FILTER',
  'OIL',
  'COOLANT',
  'BRAKE_FLUID',
  'GREASE',
  'OTHER',
] as const;
export type ProductFamily = (typeof PRODUCT_FAMILIES)[number];

/** Families that are not made for a vehicle: a vehicle filter does not apply to them. */
export const LIQUID_FAMILIES: readonly ProductFamily[] = [
  'OIL',
  'COOLANT',
  'BRAKE_FLUID',
  'GREASE',
];

export const PRODUCT_POSITIONS = ['FRONT', 'REAR'] as const;
export type ProductPosition = (typeof PRODUCT_POSITIONS)[number];

export const PAD_MATERIALS = ['CERAMIC', 'SEMIMETALLIC'] as const;
export type PadMaterial = (typeof PAD_MATERIALS)[number];

export const FILTER_TYPES = ['OIL', 'AIR', 'FUEL', 'CABIN'] as const;
export type FilterType = (typeof FILTER_TYPES)[number];

export const OIL_TYPES = ['SYNTHETIC', 'SEMI_SYNTHETIC', 'MINERAL'] as const;
export type OilType = (typeof OIL_TYPES)[number];

export const PRODUCT_PRESENTATIONS = ['QUART', 'LITER', 'GALLON', 'PAIL', 'DRUM'] as const;
export type ProductPresentation = (typeof PRODUCT_PRESENTATIONS)[number];

/** A vehicle a product fits. Null model: any model of the make; null year: no limit there. */
export interface ProductFitment {
  make: string;
  model: string | null;
  yearFrom: number | null;
  yearTo: number | null;
}

/** What a product is and fits, read by the server from its texts or corrected in the CRM. */
export interface ProductSaleSheet {
  family: ProductFamily;
  position: ProductPosition | null;
  material: PadMaterial | null;
  filterType: FilterType | null;
  viscosity: string | null;
  oilType: OilType | null;
  presentation: ProductPresentation | null;
  reference: string | null;
  fitments: ProductFitment[];
}

export const EMPTY_SALE_SHEET: Readonly<ProductSaleSheet> = Object.freeze({
  family: 'OTHER',
  position: null,
  material: null,
  filterType: null,
  viscosity: null,
  oilType: null,
  presentation: null,
  reference: null,
  fitments: [],
});

/** The customer's vehicle: the make, and the model and year when they are known. */
export interface SaleVehicle {
  make: string;
  model: string | null;
  year: number | null;
}

/** Whether a fitment covers the vehicle. What the fitment leaves open (model, years) fits. */
export function fitsVehicle(fitment: ProductFitment, vehicle: SaleVehicle): boolean {
  if (fitment.make !== vehicle.make) return false;
  if (vehicle.model !== null && fitment.model !== null && fitment.model !== vehicle.model) {
    return false;
  }
  if (vehicle.year === null) return true;
  return (
    (fitment.yearFrom === null || fitment.yearFrom <= vehicle.year) &&
    (fitment.yearTo === null || fitment.yearTo >= vehicle.year)
  );
}

export interface ProductFilter {
  /** Words in any order, matched against code, name, notes, brand and category. */
  search?: string;
  categoryId?: string;
  limit?: number;
  family?: ProductFamily;
  /** Ignored for liquid families (an oil is not made for a vehicle). */
  vehicle?: SaleVehicle;
  position?: ProductPosition;
  material?: PadMaterial;
  filterType?: FilterType;
  viscosity?: string;
  oilType?: OilType;
  presentation?: ProductPresentation;
  brand?: string;
  inStockOnly?: boolean;
}

/** One value a filter can take, with how many products it would leave. */
export interface FacetOption<T extends string = string> {
  value: T;
  count: number;
}

/** What can still be chosen given the other filters; only values that have products. */
export interface ProductFacets {
  /** Products matching the whole filter. */
  total: number;
  families: FacetOption<ProductFamily>[];
  positions: FacetOption<ProductPosition>[];
  materials: FacetOption<PadMaterial>[];
  filterTypes: FacetOption<FilterType>[];
  viscosities: FacetOption[];
  oilTypes: FacetOption<OilType>[];
  presentations: FacetOption<ProductPresentation>[];
  brands: FacetOption[];
}

export interface VehicleModelOption {
  model: string;
  count: number;
}

export interface VehicleMakeOption {
  make: string;
  /** Products that fit any vehicle of the make. */
  count: number;
  models: VehicleModelOption[];
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
