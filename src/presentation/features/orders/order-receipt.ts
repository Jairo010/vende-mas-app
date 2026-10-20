import { Linking } from 'react-native';
import type { OrderEntity } from '@/core/entities/order.entity';
import { es } from '@/shared/i18n/es';
import { formatDate, formatDateTime } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';

const ECUADOR_COUNTRY_CODE = '593';

/**
 * Phone in the international format WhatsApp expects: `0991234567` → `593991234567`.
 * Returns null when it does not look like a phone number.
 */
export function toWhatsAppPhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length < 7) return null;
  if (digits.startsWith(ECUADOR_COUNTRY_CODE)) return digits;
  if (digits.startsWith('0')) return `${ECUADOR_COUNTRY_CODE}${digits.slice(1)}`;
  return `${ECUADOR_COUNTRY_CODE}${digits}`;
}

/** Plain-text receipt for WhatsApp (USD, VAT 15 %). */
export function buildOrderReceiptText(order: OrderEntity): string {
  const r = es.orders.receipt;
  const lines = [
    `*${r.title} ${order.orderNumber ?? `(${r.pendingNumber})`}*`,
    `${es.orders.fields.customer}: ${order.customerName ?? '—'}`,
    `${es.orders.fields.createdAt}: ${formatDateTime(order.createdAt)}`,
  ];
  if (order.estimatedDeliveryDate) {
    lines.push(`${es.orders.fields.delivery}: ${formatDate(order.estimatedDeliveryDate)}`);
  }
  lines.push('');

  for (const item of order.items) {
    lines.push(`• ${item.quantity} x ${item.productName} (${item.productCode})`);
    lines.push(`   ${formatCurrency(item.unitPrice)} c/u = ${formatCurrency(item.totalPrice)}`);
    if (item.discount > 0) {
      lines.push(
        `   ${es.orders.discount}${item.promotionName ? ` ${item.promotionName}` : ''}: -${formatCurrency(item.discount)}`,
      );
    }
  }

  lines.push(
    '',
    `${es.orders.subtotal}: ${formatCurrency(order.subtotal)}`,
    ...(order.discountTotal > 0
      ? [`${es.orders.discount}: -${formatCurrency(order.discountTotal)}`]
      : []),
    `${es.orders.tax}: ${formatCurrency(order.taxTotal)}`,
    `*${es.orders.total}: ${formatCurrency(order.total)}*`,
    '',
    r.footer,
  );
  return lines.join('\n');
}

/** Opens WhatsApp with the receipt, addressed to the customer's phone when there is one. */
export async function shareOrderOnWhatsApp(
  order: OrderEntity,
  phone: string | null | undefined,
): Promise<void> {
  const text = encodeURIComponent(buildOrderReceiptText(order));
  const target = toWhatsAppPhone(phone);
  await Linking.openURL(`https://wa.me/${target ?? ''}?text=${text}`);
}
