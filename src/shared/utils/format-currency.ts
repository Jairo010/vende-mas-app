import { businessConfig } from '@/shared/config/business-config';

/** Money in the company currency and locale (both overridable). */
export function formatCurrency(
  amount: number,
  currency: string = businessConfig().currency,
  locale: string = businessConfig().locale,
): string {
  const value = Number.isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
