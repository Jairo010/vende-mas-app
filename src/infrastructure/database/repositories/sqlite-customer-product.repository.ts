import { desc, eq } from 'drizzle-orm';
import type { ICustomerProductRepositoryPort } from '@/core/ports/customer-product.repository.port';
import type { CustomerProduct } from '@/core/types/customer-product.types';
import { customerProducts } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

export class SqliteCustomerProductRepository implements ICustomerProductRepositoryPort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async findByCustomer(customerId: string): Promise<CustomerProduct[]> {
    return this.ctx
      .db()
      .select()
      .from(customerProducts)
      .where(eq(customerProducts.customerId, customerId))
      .orderBy(desc(customerProducts.purchaseCount), desc(customerProducts.lastPurchasedAt))
      .all();
  }
}

export const sqliteCustomerProductRepository = new SqliteCustomerProductRepository();
