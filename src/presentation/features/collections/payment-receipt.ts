import { Linking } from 'react-native';
import type { PaymentEntity } from '@/core/entities/payment.entity';
import { ReceivableEntity } from '@/core/entities/receivable.entity';
import type { Installment } from '@/core/types/collection.types';
import { es } from '@/shared/i18n/es';
import { formatDate, formatDateTime } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';
import { toWhatsAppPhone } from '../orders/order-receipt';
import { PAYMENT_METHOD_VISUALS } from './payment-method-visuals';

/**
 * Plain-text receipt of a payment for WhatsApp: balance before → payment → balance after, per
 * installment and for the document, the customer's whole debt and what is left to pay (API
 * ADR 0044).
 */
export function buildPaymentReceiptText(
  payment: PaymentEntity,
  balance: number | null,
  pending: readonly Installment[] = [],
): string {
  const r = es.collections.receipt;
  const lines = [
    `*${r.title}*`,
    `${r.customer}: ${payment.customerName ?? '—'}`,
    `${r.document}: ${payment.documentNumber || es.collections.pendingNumber}`,
    `${r.date}: ${formatDateTime(payment.paidAt)}`,
    `${r.method}: ${PAYMENT_METHOD_VISUALS[payment.method].label}`,
  ];
  if (payment.reference) {
    lines.push(
      `${r.reference}: ${payment.reference}${payment.bankName ? ` (${payment.bankName})` : ''}`,
    );
  }
  if (payment.allocations.length > 0) {
    lines.push('', `${r.installments}:`);
    for (const allocation of payment.allocations) {
      const before = allocation.balanceBefore;
      lines.push(
        before === null || before === undefined
          ? `- #${allocation.installmentNumber}: ${formatCurrency(allocation.amount)}`
          : `- #${allocation.installmentNumber}: ${formatCurrency(before)} - ${formatCurrency(allocation.amount)} = ${formatCurrency(Math.max(0, before - allocation.amount))}`,
      );
    }
  }

  const balances = payment.balances;
  lines.push('');
  if (balances) lines.push(`${r.balanceBefore}: ${formatCurrency(balances.receivableBefore)}`);
  lines.push(`*${r.paid}: ${formatCurrency(payment.amount)}*`);
  if (balance !== null) lines.push(`*${r.balanceAfter}: ${formatCurrency(balance)}*`);
  if (balances && balances.customerAfter !== null) {
    lines.push(`${r.customerDebt}: ${formatCurrency(balances.customerAfter)}`);
  }

  if (pending.length > 0) {
    lines.push('', `${r.pending}:`);
    for (const installment of pending) {
      lines.push(
        `- #${installment.number} ${formatDate(installment.dueDate)}: ${formatCurrency(ReceivableEntity.remainingOf(installment))}`,
      );
    }
  }
  lines.push('', r.footer);
  return lines.join('\n');
}

export async function sharePaymentOnWhatsApp(
  payment: PaymentEntity,
  balance: number | null,
  phone: string | null | undefined,
  pending: readonly Installment[] = [],
): Promise<void> {
  const text = encodeURIComponent(buildPaymentReceiptText(payment, balance, pending));
  await Linking.openURL(`https://wa.me/${toWhatsAppPhone(phone) ?? ''}?text=${text}`);
}
