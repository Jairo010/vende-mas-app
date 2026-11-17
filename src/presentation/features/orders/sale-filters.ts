import type { ProductEntity } from '@/core/entities/product.entity';
import type {
  ProductFacets,
  ProductFamily,
  ProductFilter,
  ProductFitment,
  SaleVehicle,
} from '@/core/types/catalog.types';
import { es } from '@/shared/i18n/es';

const t = es.orders.filters;

/** The filters of the sale catalog, apart from the search text and the vehicle. */
export type SaleFilters = Pick<
  ProductFilter,
  | 'family'
  | 'position'
  | 'material'
  | 'filterType'
  | 'viscosity'
  | 'oilType'
  | 'presentation'
  | 'brand'
  | 'inStockOnly'
>;

/** Filters with a list of options (everything but the family and the stock switch). */
export type AttributeFilter = Exclude<keyof SaleFilters, 'family' | 'inStockOnly'>;

/** What can be filtered inside each family, in the order sellers are asked for it. */
const ATTRIBUTES_BY_FAMILY: Readonly<Record<ProductFamily, readonly AttributeFilter[]>> = {
  BRAKE_PAD: ['position', 'material', 'brand'],
  BRAKE_SHOE: ['position', 'brand'],
  BRAKE_DISC: ['position', 'brand'],
  FILTER: ['filterType', 'brand'],
  OIL: ['viscosity', 'oilType', 'presentation', 'brand'],
  COOLANT: ['presentation', 'brand'],
  BRAKE_FLUID: ['presentation', 'brand'],
  GREASE: ['presentation', 'brand'],
  OTHER: ['brand'],
};

export function attributesOf(family: ProductFamily | undefined): readonly AttributeFilter[] {
  return family ? ATTRIBUTES_BY_FAMILY[family] : ['brand'];
}

const FACET_OF: Readonly<
  Record<AttributeFilter, Exclude<keyof ProductFacets, 'total' | 'families'>>
> = {
  position: 'positions',
  material: 'materials',
  filterType: 'filterTypes',
  viscosity: 'viscosities',
  oilType: 'oilTypes',
  presentation: 'presentations',
  brand: 'brands',
};

export function optionsOf(
  facets: ProductFacets,
  attribute: AttributeFilter,
): readonly { value: string; count: number }[] {
  return facets[FACET_OF[attribute]];
}

/** The text of a value: translated for the fixed lists, as it is for brands and viscosities. */
export function optionLabel(attribute: AttributeFilter, value: string): string {
  const labels: Readonly<Record<string, string>> | undefined =
    attribute === 'position'
      ? t.positions
      : attribute === 'material'
        ? t.materials
        : attribute === 'filterType'
          ? t.filterTypes
          : attribute === 'oilType'
            ? t.oilTypes
            : attribute === 'presentation'
              ? t.presentations
              : undefined;
  return labels?.[value] ?? value;
}

/** Choosing another family drops what belonged to the previous one. */
export function withFamily(filters: SaleFilters, family: ProductFamily | undefined): SaleFilters {
  return { ...(family && { family }), ...(filters.inStockOnly && { inStockOnly: true }) };
}

export function hasActiveFilters(filters: SaleFilters, vehicle: SaleVehicle | null): boolean {
  return vehicle !== null || Object.values(filters).some(Boolean);
}

/** `Spark 2015`, `Chevrolet` when only the make is known. */
export function vehicleLabel(vehicle: SaleVehicle): string {
  return [vehicle.model ?? vehicle.make, vehicle.year].filter(Boolean).join(' ');
}

/** `Spark 2008-2015`, `Hilux desde 2006`, `Chevrolet`. */
export function fitmentLabel(fitment: ProductFitment): string {
  const name = fitment.model ?? fitment.make;
  if (fitment.yearFrom !== null && fitment.yearTo !== null) {
    return fitment.yearFrom === fitment.yearTo
      ? `${name} ${fitment.yearFrom}`
      : `${name} ${fitment.yearFrom}-${fitment.yearTo}`;
  }
  if (fitment.yearFrom !== null) return `${name} ${t.since(fitment.yearFrom)}`;
  if (fitment.yearTo !== null) return `${name} ${t.until(fitment.yearTo)}`;
  return name;
}

/** Most vehicles named on a catalog line; the rest are counted. */
const MAX_FITMENTS_SHOWN = 2;

/**
 * What a seller checks before adding the product: the vehicles it fits (those of the customer's
 * vehicle when one is chosen) and its position. Empty when the sheet says nothing.
 */
export function productFitLine(product: ProductEntity, vehicle: SaleVehicle | null): string {
  const fitments = product.fitmentsFor(vehicle);
  const shown = fitments.slice(0, MAX_FITMENTS_SHOWN).map(fitmentLabel);
  if (fitments.length > MAX_FITMENTS_SHOWN) {
    shown.push(t.moreVehicles(fitments.length - MAX_FITMENTS_SHOWN));
  }
  const parts = [shown.join(', ')];
  if (product.saleSheet.position) parts.push(t.positions[product.saleSheet.position]);
  return parts.filter(Boolean).join(' · ');
}
