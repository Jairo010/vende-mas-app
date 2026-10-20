import { PaymentEntity } from '@/core/entities/payment.entity';
import { ReceivableEntity } from '@/core/entities/receivable.entity';
import {
  PAYMENT_METHODS,
  PAYMENT_PLAN_TYPES,
  type CollectionsSettings,
  type InstallmentStatus,
  type ReceivableSource,
  type ReceivableStatus,
} from '@/core/types/collection.types';
import type {
  CollectionPaymentResponseDto,
  ReceivableResponseDto,
  SyncSettingsDto,
} from '@/infrastructure/api/dto/collection.dto';
import { pickEnum } from './enum.mapper';

const RECEIVABLE_STATUSES: readonly ReceivableStatus[] = ['OPEN', 'PAID', 'CANCELLED'];
const RECEIVABLE_SOURCES: readonly ReceivableSource[] = ['ORDER', 'BILLING'];
const INSTALLMENT_STATUSES: readonly InstallmentStatus[] = ['PENDING', 'PARTIAL', 'PAID'];

export class CollectionMapper {
  static toReceivable(dto: ReceivableResponseDto): ReceivableEntity {
    return ReceivableEntity.create({
      id: dto.id,
      customerId: dto.customerId,
      customerName: null,
      sellerId: dto.sellerId,
      orderId: dto.orderId,
      source: pickEnum(dto.source, RECEIVABLE_SOURCES, 'BILLING'),
      documentNumber: dto.documentNumber,
      planType: pickEnum(dto.planType, PAYMENT_PLAN_TYPES, 'SINGLE'),
      issuedAt: dto.issuedAt,
      total: dto.total,
      paidAmount: dto.paidAmount,
      externalPaidAmount: dto.externalPaidAmount,
      status: pickEnum(dto.status, RECEIVABLE_STATUSES, 'OPEN'),
      installments: dto.installments.map((installment) => ({
        id: installment.id,
        number: installment.number,
        dueDate: installment.dueDate,
        amount: installment.amount,
        paidAmount: installment.paidAmount,
        status: pickEnum(installment.status, INSTALLMENT_STATUSES, 'PENDING'),
      })),
      syncStatus: 'SYNCED',
      updatedAt: dto.updatedAt,
    });
  }

  static toPayment(dto: CollectionPaymentResponseDto): PaymentEntity {
    return PaymentEntity.create({
      id: dto.id,
      receivableId: dto.receivableId,
      customerId: dto.customerId,
      customerName: null,
      documentNumber: null,
      sellerId: dto.sellerId,
      visitId: dto.visitId,
      amount: dto.amount,
      method: pickEnum(dto.method, PAYMENT_METHODS, 'CASH'),
      reference: dto.reference,
      bankName: dto.bankName,
      checkDate: dto.checkDate,
      photoUrl: dto.photoUrl,
      photoLocalUri: null,
      notes: dto.notes,
      paidAt: dto.paidAt,
      allocations: dto.allocations.map((allocation) => ({ ...allocation })),
      syncStatus: 'SYNCED',
    });
  }

  static toSettings(dto: SyncSettingsDto | undefined | null): CollectionsSettings | null {
    if (!dto || typeof dto.blockOrdersWhenOverdue !== 'boolean') return null;
    return {
      blockOrdersWhenOverdue: dto.blockOrdersWhenOverdue,
      overdueGraceDays: Math.max(0, Number(dto.overdueGraceDays) || 0),
    };
  }
}
