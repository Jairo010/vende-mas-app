import { Linking } from 'react-native';
import type { PaymentEntity } from '@/core/entities/payment.entity';
import { es } from '@/shared/i18n/es';
import { formatDateTime } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';
import { toWhatsAppPhone } from '../orders/order-receipt';
import { PAYMENT_METHOD_VISUALS } from './payment-method-visuals';

/** Plain-text receipt of a payment for WhatsApp. */
export function buildPaymentReceiptText(payment: PaymentEntity, balance: number | null): string {
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
    lines.push(
      `${r.installments}: ${payment.allocations
        .map(
          (allocation) => `#${allocation.installmentNumber} ${formatCurrency(allocation.amount)}`,
        )
        .join(', ')}`,
    );
  }
  lines.push('', `*${r.amount}: ${formatCurrency(payment.amount)}*`);
  if (balance !== null) lines.push(`${r.balance}: ${formatCurrency(balance)}`);
  lines.push('', r.footer);
  return lines.join('\n');
}

export async function sharePaymentOnWhatsApp(
  payment: PaymentEntity,
  balance: number | null,
  phone: string | null | undefined,
): Promise<void> {
  const text = encodeURIComponent(buildPaymentReceiptText(payment, balance));
  await Linking.openURL(`https://wa.me/${toWhatsAppPhone(phone) ?? ''}?text=${text}`);
}
