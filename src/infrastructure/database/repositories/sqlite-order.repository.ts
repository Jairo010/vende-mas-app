import { and, desc, eq, gte, inArray, lte, type SQL } from 'drizzle-orm';
import type { OrderEntity } from '@/core/entities/order.entity';
import { CustomerNotFoundError } from '@/core/errors/customer.errors';
import {
  OrderCustomerNotActiveError,
  OrderEmptyError,
  OrderNotFoundError,
  OrderProductUnavailableError,
} from '@/core/errors/order.errors';
import type { IOrderRepositoryPort } from '@/core/ports/order.repository.port';
import type { ActorContext } from '@/core/ports/visit.repository.port';
import type { CreateOrderInput, OrderFilter } from '@/core/types/order.types';
import { priceOrder } from '@/core/value-objects/order-pricing';
import type { CreateOrderRequestDto } from '@/infrastructure/api/dto/order.dto';
import { toZonedIsoString } from '@/shared/utils/date';
import { CatalogRowMapper } from '../mappers/catalog-row.mapper';
import { CustomerRowMapper } from '../mappers/customer-row.mapper';
import { OrderRowMapper, type OrderItemRow, type OrderRow } from '../mappers/order-row.mapper';
import {
  buildIdempotencyKey,
  compactPayload,
  enqueueOperation,
  type DbExecutor,
} from '../outbox-writer';
import { customers, orderItems, orders, products, promotions } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

const DEFAULT_ORDER_LIMIT = 100;

export class SqliteOrderRepository implements IOrderRepositoryPort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async findAll(filter: OrderFilter = {}): Promise<OrderEntity[]> {
    const conditions: SQL[] = [];
    if (filter.customerId) conditions.push(eq(orders.customerId, filter.customerId));
    if (filter.visitId) conditions.push(eq(orders.visitId, filter.visitId));

    const db = this.ctx.db();
    const rows = db
      .select()
      .from(orders)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(filter.limit ?? DEFAULT_ORDER_LIMIT)
      .all();
    return this.withItems(db, rows);
  }

  public async findById(id: string): Promise<OrderEntity | null> {
    const db = this.ctx.db();
    const row = db.select().from(orders).where(eq(orders.id, id)).get();
    return row ? (this.withItems(db, [row])[0] ?? null) : null;
  }

  public async create(input: CreateOrderInput, actor: ActorContext): Promise<OrderEntity> {
    if (input.items.length === 0) throw new OrderEmptyError();

    const id = this.ctx.newId();
    const now = this.ctx.now();
    const nowIso = now.toISOString();

    return this.ctx.db().transaction((tx) => {
      const customerRow = tx
        .select()
        .from(customers)
        .where(eq(customers.id, input.customerId))
        .get();
      if (!customerRow) throw new CustomerNotFoundError();
      const customer = CustomerRowMapper.toDomain(customerRow);
      if (!customer.canTakeOrders()) throw new OrderCustomerNotActiveError();

      const items = input.items.map((item) => {
        const product = tx.select().from(products).where(eq(products.id, item.productId)).get();
        if (!product || !product.isActive) throw new OrderProductUnavailableError(item.productId);
        return { product, quantity: item.quantity };
      });
      // Same promotion engine as the API: the local estimate matches the official order.
      const activePromotions = tx
        .select()
        .from(promotions)
        .where(and(lte(promotions.startsAt, nowIso), gte(promotions.endsAt, nowIso)))
        .all()
        .map(CatalogRowMapper.toPromotion);
      const priced = priceOrder(items, activePromotions, now);
      const totals = priced.totals;

      const lines = priced.lines.map((line, index) => {
        const { product } = items[index];
        return {
          id: this.ctx.newId(),
          orderId: id,
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: line.discount,
          totalPrice: line.totalPrice,
          taxRate: line.taxRate,
          taxAmount: line.taxAmount,
          promotionName: line.promotion?.name ?? null,
        } satisfies OrderItemRow;
      });

      tx.insert(orders)
        .values({
          id,
          orderNumber: null,
          customerId: customer.id,
          customerName: customer.tradeName,
          visitId: input.visitId ?? null,
          sellerId: actor.userId,
          status: 'CONFIRMED',
          ...totals,
          estimatedDeliveryDate: input.estimatedDeliveryDate ?? null,
          notes: input.notes ?? null,
          billingSyncStatus: 'PENDING',
          syncStatus: 'PENDING',
          createdAt: nowIso,
          updatedAt: nowIso,
        })
        .run();
      tx.insert(orderItems).values(lines).run();

      const payload: CreateOrderRequestDto = {
        id,
        customerId: customer.id,
        visitId: input.visitId,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          expectedUnitPrice: line.unitPrice,
        })),
        estimatedDeliveryDate: input.estimatedDeliveryDate,
        notes: input.notes,
      };
      enqueueOperation(
        tx,
        {
          idempotencyKey: buildIdempotencyKey('ORDER', 'CREATE', id, this.ctx.newId()),
          entityType: 'ORDER',
          entityId: id,
          action: 'CREATE',
          payload: compactPayload(payload),
          clientTimestamp: toZonedIsoString(now),
        },
        nowIso,
      );

      const row = tx.select().from(orders).where(eq(orders.id, id)).get();
      if (!row) throw new OrderNotFoundError();
      return OrderRowMapper.toDomain(row, lines);
    });
  }

  private withItems(db: DbExecutor, rows: OrderRow[]): OrderEntity[] {
    if (rows.length === 0) return [];
    const items = db
      .select()
      .from(orderItems)
      .where(
        inArray(
          orderItems.orderId,
          rows.map((row) => row.id),
        ),
      )
      .all();
    return rows.map((row) =>
      OrderRowMapper.toDomain(
        row,
        items.filter((item) => item.orderId === row.id),
      ),
    );
  }
}

export const sqliteOrderRepository = new SqliteOrderRepository();
