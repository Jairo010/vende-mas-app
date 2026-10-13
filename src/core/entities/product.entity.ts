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
  }

  public static create(props: ProductProps): ProductEntity {
    return new ProductEntity(props);
  }

  public isOutOfStock(): boolean {
    return this.stockQuantity <= 0;
  }
}
