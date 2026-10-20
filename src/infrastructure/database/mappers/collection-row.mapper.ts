import { PaymentEntity } from '@/core/entities/payment.entity';
import { ReceivableEntity } from '@/core/entities/receivable.entity';
import type {
  InstallmentStatus,
  PaymentMethod,
  PaymentPlanType,
  ReceivableSource,
  ReceivableStatus,
} from '@/core/types/collection.types';
import type { LocalSyncStatus } from '@/core/types/visit.types';
import type { payments, receivableInstallments, receivables } from '../schema';

export type ReceivableRow = typeof receivables.$inferSelect;
export type ReceivableInsert = typeof receivables.$inferInsert;
export type InstallmentRow = typeof receivableInstallments.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type PaymentInsert = typeof payments.$inferInsert;

export class CollectionRowMapper {
  static toReceivable(
    row: ReceivableRow,
    installments: InstallmentRow[],
    customerName: string | null,
  ): ReceivableEntity {
    return ReceivableEntity.create({
      id: row.id,
      customerId: row.customerId,
      customerName,
      sellerId: row.sellerId,
      orderId: row.orderId,
      source: row.source as ReceivableSource,
      documentNumber: row.documentNumber,
      planType: row.planType as PaymentPlanType,
      issuedAt: row.issuedAt,
      total: row.total,
      paidAmount: row.paidAmount,
      externalPaidAmount: row.externalPaidAmount,
      status: row.status as ReceivableStatus,
      installments: installments.map((installment) => ({
        id: installment.id,
        number: installment.number,
        dueDate: installment.dueDate,
        amount: installment.amount,
        paidAmount: installment.paidAmount,
        status: installment.status as InstallmentStatus,
      })),
      syncStatus: row.syncStatus as LocalSyncStatus,
      updatedAt: row.updatedAt,
    });
  }

  /** Server columns only (sync status is local bookkeeping). */
  static toReceivableColumns(entity: ReceivableEntity): ReceivableInsert {
    return {
      id: entity.id,
      customerId: entity.customerId,
      sellerId: entity.sellerId,
      orderId: entity.orderId,
      source: entity.source,
      documentNumber: entity.documentNumber,
      planType: entity.planType,
      issuedAt: entity.issuedAt,
      total: entity.total,
      paidAmount: entity.paidAmount,
      externalPaidAmount: entity.externalPaidAmount,
      status: entity.status,
      updatedAt: entity.updatedAt,
    };
  }

  static toInstallmentRows(entity: ReceivableEntity): InstallmentRow[] {
    return entity.installments.map((installment) => ({
      ...installment,
      receivableId: entity.id,
    }));
  }

  static toPayment(
    row: PaymentRow,
    customerName: string | null,
    documentNumber: string | null,
  ): PaymentEntity {
    return PaymentEntity.create({
      id: row.id,
      receivableId: row.receivableId,
      customerId: row.customerId,
      customerName,
      documentNumber,
      sellerId: row.sellerId,
      visitId: row.visitId,
      amount: row.amount,
      method: row.method as PaymentMethod,
      reference: row.reference,
      bankName: row.bankName,
      checkDate: row.checkDate,
      photoUrl: row.photoUrl,
      photoLocalUri: row.photoLocalUri,
      notes: row.notes,
      paidAt: row.paidAt,
      allocations: row.allocations,
      syncStatus: row.syncStatus as LocalSyncStatus,
    });
  }

  /** Server columns only (the local photo URI and sync status are kept). */
  static toPaymentColumns(entity: PaymentEntity, createdAt: string): PaymentInsert {
    return {
      id: entity.id,
      receivableId: entity.receivableId,
      customerId: entity.customerId,
      sellerId: entity.sellerId,
      visitId: entity.visitId,
      amount: entity.amount,
      method: entity.method,
      reference: entity.reference,
      bankName: entity.bankName,
      checkDate: entity.checkDate,
      photoUrl: entity.photoUrl,
      notes: entity.notes,
      paidAt: entity.paidAt,
      allocations: entity.allocations,
      createdAt,
    };
  }
}
