import {
  EMPTY_SALE_SHEET,
  fitsVehicle,
  type ProductFitment,
  type ProductSaleSheet,
  type SaleVehicle,
} from '../types/catalog.types';

export interface ProductProps {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  description: string | null;
  categoryId: string;
  categoryName: string;
  /** Unit price without VAT (USD). */
  basePrice: number;
  /** VAT rate as a fraction (0.15). */
  taxRate: number;
  priceWithTax: number;
  unitOfMeasure: string;
  stockQuantity: number;
  imageUrl: string | null;
  isActive: boolean;
  /** Missing on products downloaded before sale sheets existed. */
  saleSheet?: ProductSaleSheet;
}

/** Catalog product, mirrored from the billing system through the API. */
export class ProductEntity {
  public readonly id: string;
  public readonly code: string;
  public readonly name: string;
  public readonly brand: string | null;
  public readonly description: string | null;
  public readonly categoryId: string;
  public readonly categoryName: string;
  public readonly basePrice: number;
  public readonly taxRate: number;
  public readonly priceWithTax: number;
  public readonly unitOfMeasure: string;
  public readonly stockQuantity: number;
  public readonly imageUrl: string | null;
  public readonly isActive: boolean;
  /** What the product is and fits (API ADR 0045). */
  public readonly saleSheet: Readonly<ProductSaleSheet>;

  constructor(props: ProductProps) {
    this.id = props.id;
    this.code = props.code;
    this.name = props.name;
    this.brand = props.brand;
    this.description = props.description;
    this.categoryId = props.categoryId;
    this.categoryName = props.categoryName;
    this.basePrice = props.basePrice;
    this.taxRate = props.taxRate;
    this.priceWithTax = props.priceWithTax;
    this.unitOfMeasure = props.unitOfMeasure;
    this.stockQuantity = props.stockQuantity;
    this.imageUrl = props.imageUrl;
    this.isActive = props.isActive;
    this.saleSheet = props.saleSheet ?? EMPTY_SALE_SHEET;
  }

  public static create(props: ProductProps): ProductEntity {
    return new ProductEntity(props);
  }

  /** The fitments that cover the vehicle (all of them without a vehicle). */
  public fitmentsFor(vehicle?: SaleVehicle | null): ProductFitment[] {
    if (!vehicle) return [...this.saleSheet.fitments];
    return this.saleSheet.fitments.filter((fitment) => fitsVehicle(fitment, vehicle));
  }

  public isOutOfStock(): boolean {
    return this.stockQuantity <= 0;
  }
}
