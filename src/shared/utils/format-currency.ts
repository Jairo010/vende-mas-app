export function formatCurrency(amount: number, currency = 'USD', locale = 'es-PE'): string {
  if (isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
