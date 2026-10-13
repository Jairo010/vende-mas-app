import { and, asc, desc, eq, gte, inArray, lte, type SQL } from 'drizzle-orm';
import type { PaymentEntity } from '@/core/entities/payment.entity';
import type { ReceivableEntity } from '@/core/entities/receivable.entity';
import {
  InvalidPaymentError,
  PaymentExceedsBalanceError,
  ReceivableNotFoundError,
  ReceivableNotOpenError,
} from '@/core/errors/collection.errors';
import type { ICollectionRepositoryPort } from '@/core/ports/collection.repository.port';
import type { ActorContext } from '@/core/ports/visit.repository.port';
import {
  METHODS_REQUIRING_BANK,
  METHODS_REQUIRING_REFERENCE,
  PAYMENT_METHODS,
  type CollectionsSettings,
  type CustomerBalance,
  type PaymentFilter,
  type ReceivableFilter,
  type RegisterPaymentInput,
} from '@/core/types/collection.types';
import {
  allocatePayment,
  fromCents,
  isValidAmount,
  toCents,
} from '@/core/value-objects/payment-schedule';
import type { RegisterPaymentRequestDto } from '@/infrastructure/api/dto/collection.dto';
import { toZonedIsoString } from '@/shared/utils/date';
import { readCollectionsSettings } from '../collections-settings.store';
import { CollectionRowMapper, type ReceivableRow } from '../mappers/collection-row.mapper';
import {
  buildIdempotencyKey,
  compactPayload,
  enqueueOperation,
  registerPendingPhoto,
  type DbExecutor,
} from '../outbox-writer';
import { customers, payments, receivableInstallments, receivables } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

const PAYMENTS_LIMIT = 200;

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const money = (amount: number) => `$${amount.toFixed(2)}`;

export class SqliteCollectionRepository implements ICollectionRepositoryPort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async findReceivables(filter: ReceivableFilter = {}): Promise<ReceivableEntity[]> {
    const conditions: SQL[] = [];
    if (filter.customerId) conditions.push(eq(receivables.customerId, filter.customerId));
    if (filter.onlyOpen) conditions.push(eq(receivables.status, 'OPEN'));

    const db = this.ctx.db();
    const rows = db
      .select({ receivable: receivables, customerName: customers.tradeName })
      .from(receivables)
      .leftJoin(customers, eq(customers.id, receivables.customerId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(receivables.issuedAt), asc(receivables.id))
      .all();
    const entities = this.withInstallments(db, rows);
    return filter.onlyOpen ? entities.filter((receivable) => receivable.isOpen()) : entities;
  }

  public async findReceivableById(id: string): Promise<ReceivableEntity | null> {
    return this.load(this.ctx.db(), id);
  }

  public async findPayments(filter: PaymentFilter = {}): Promise<PaymentEntity[]> {
    const conditions: SQL[] = [];
    if (filter.customerId) conditions.push(eq(payments.customerId, filter.customerId));
    if (filter.visitId) conditions.push(eq(payments.visitId, filter.visitId));
    if (filter.from) conditions.push(gte(payments.paidAt, filter.from));
    if (filter.to) conditions.push(lte(payments.paidAt, filter.to));

    return this.ctx
      .db()
      .select({
        payment: payments,
        customerName: customers.tradeName,
        documentNumber: receivables.documentNumber,
      })
      .from(payments)
      .leftJoin(customers, eq(customers.id, payments.customerId))
      .leftJoin(receivables, eq(receivables.id, payments.receivableId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(payments.paidAt))
      .limit(PAYMENTS_LIMIT)
      .all()
      .map((row) =>
        CollectionRowMapper.toPayment(row.payment, row.customerName, row.documentNumber),
      );
  }

  public async findPaymentById(id: string): Promise<PaymentEntity | null> {
    const row = this.ctx
      .db()
      .select({
        payment: payments,
        customerName: customers.tradeName,
        documentNumber: receivables.documentNumber,
      })
      .from(payments)
      .leftJoin(customers, eq(customers.id, payments.customerId))
      .leftJoin(receivables, eq(receivables.id, payments.receivableId))
      .where(eq(payments.id, id))
      .get();
    return row
      ? CollectionRowMapper.toPayment(row.payment, row.customerName, row.documentNumber)
      : null;
  }

  public async getCustomerBalance(
    customerId: string,
    asOf: Date = this.ctx.now(),
  ): Promise<CustomerBalance> {
    const settings = readCollectionsSettings(this.ctx.db());
    const open = await this.findReceivables({ customerId, onlyOpen: true });
    const balanceCents = open.reduce((sum, receivable) => sum + toCents(receivable.balance), 0);
    const overdueCents = open.reduce(
      (sum, receivable) => sum + toCents(receivable.overdueAmount(asOf, settings.overdueGraceDays)),
      0,
    );
    return {
      balance: fromCents(balanceCents),
      overdue: fromCents(overdueCents),
      openReceivables: open.length,
    };
  }

  public async registerPayment(
    input: RegisterPaymentInput,
    actor: ActorContext,
  ): Promise<PaymentEntity> {
    SqliteCollectionRepository.validate(input);
    const id = this.ctx.newId();
    const photoId = input.photoLocalUri ? this.ctx.newId() : null;
    const now = this.ctx.now();
    const nowIso = now.toISOString();
    const reference = clean(input.reference);
    const bankName = clean(input.bankName);
    const notes = clean(input.notes);
    const checkDate = input.method === 'CHECK' ? (input.checkDate ?? null) : null;

    return this.ctx.db().transaction((tx) => {
      const receivable = this.load(tx, input.receivableId);
      if (!receivable) throw new ReceivableNotFoundError();
      if (!receivable.isOpen()) throw new ReceivableNotOpenError();
      if (toCents(input.amount) > toCents(receivable.balance)) {
        throw new PaymentExceedsBalanceError(money(receivable.balance));
      }

      // Same rule as the server: oldest installment first.
      const { installments, allocations } = allocatePayment(receivable.installments, input.amount);
      for (const installment of installments) {
        tx.update(receivableInstallments)
          .set({ paidAmount: installment.paidAmount, status: installment.status })
          .where(eq(receivableInstallments.id, installment.id))
          .run();
      }
      const paidAmount = fromCents(toCents(receivable.paidAmount) + toCents(input.amount));
      const settled = toCents(input.amount) === toCents(receivable.balance);
      tx.update(receivables)
        .set({ paidAmount, status: settled ? 'PAID' : receivable.status, updatedAt: nowIso })
        .where(eq(receivables.id, receivable.id))
        .run();

      tx.insert(payments)
        .values({
          id,
          receivableId: receivable.id,
          customerId: receivable.customerId,
          sellerId: actor.userId,
          visitId: input.visitId ?? null,
          amount: input.amount,
          method: input.method,
          reference: reference ?? null,
          bankName: bankName ?? null,
          checkDate,
          photoLocalUri: input.photoLocalUri ?? null,
          notes: notes ?? null,
          paidAt: nowIso,
          allocations,
          syncStatus: 'PENDING',
          createdAt: nowIso,
        })
        .run();

      if (photoId && input.photoLocalUri) {
        registerPendingPhoto(tx, photoId, input.photoLocalUri, nowIso);
      }

      const payload: RegisterPaymentRequestDto = {
        id,
        receivableId: receivable.id,
        amount: input.amount,
        method: input.method,
        reference,
        bankName,
        checkDate: checkDate ?? undefined,
        notes,
        visitId: input.visitId,
        paidAt: toZonedIsoString(now),
      };
      enqueueOperation(
        tx,
        {
          idempotencyKey: buildIdempotencyKey('PAYMENT', 'CREATE', id, this.ctx.newId()),
          entityType: 'PAYMENT',
          entityId: id,
          action: 'CREATE',
          payload: compactPayload(payload),
          clientTimestamp: toZonedIsoString(now),
          ...(photoId && { photoId, photoField: 'photoUrl' }),
        },
        nowIso,
      );

      const row = tx
        .select({
          payment: payments,
          customerName: customers.tradeName,
        })
        .from(payments)
        .leftJoin(customers, eq(customers.id, payments.customerId))
        .where(eq(payments.id, id))
        .get();
      if (!row) throw new ReceivableNotFoundError();
      return CollectionRowMapper.toPayment(
        row.payment,
        row.customerName,
        receivable.documentNumber,
      );
    });
  }

  public async getSettings(): Promise<CollectionsSettings> {
    return readCollectionsSettings(this.ctx.db());
  }

  /** Same data rules as the API (cash needs nothing; the rest, their reference / bank). */
  private static validate(input: RegisterPaymentInput): void {
    if (!PAYMENT_METHODS.includes(input.method)) {
      throw new InvalidPaymentError('Forma de pago no válida');
    }
    if (!isValidAmount(input.amount)) {
      throw new InvalidPaymentError('El monto debe ser mayor a 0, con hasta 2 decimales');
    }
    if (METHODS_REQUIRING_REFERENCE.includes(input.method) && !clean(input.reference)) {
      throw new InvalidPaymentError('Ingresa el número de referencia, cheque o voucher', {
        field: 'reference',
      });
    }
    if (METHODS_REQUIRING_BANK.includes(input.method) && !clean(input.bankName)) {
      throw new InvalidPaymentError('Ingresa el banco', { field: 'bankName' });
    }
  }

  private load(db: DbExecutor, id: string): ReceivableEntity | null {
    const row = db
      .select({ receivable: receivables, customerName: customers.tradeName })
      .from(receivables)
      .leftJoin(customers, eq(customers.id, receivables.customerId))
      .where(eq(receivables.id, id))
      .get();
    return row ? (this.withInstallments(db, [row])[0] ?? null) : null;
  }

  private withInstallments(
    db: DbExecutor,
    rows: { receivable: ReceivableRow; customerName: string | null }[],
  ): ReceivableEntity[] {
    if (rows.length === 0) return [];
    const installments = db
      .select()
      .from(receivableInstallments)
      .where(
        inArray(
          receivableInstallments.receivableId,
          rows.map((row) => row.receivable.id),
        ),
      )
      .all();
    return rows.map((row) =>
      CollectionRowMapper.toReceivable(
        row.receivable,
        installments.filter((installment) => installment.receivableId === row.receivable.id),
        row.customerName,
      ),
    );
  }
}

export const sqliteCollectionRepository = new SqliteCollectionRepository();
