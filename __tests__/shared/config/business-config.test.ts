import {
  businessConfig,
  configureBusiness,
  DEFAULT_BUSINESS_CONFIG,
  resetBusinessConfig,
} from '@/shared/config/business-config';
import { todayKey, toZonedIsoString } from '@/shared/utils/date/local-date';
import { formatCurrency } from '@/shared/utils/format-currency';

describe('business config (company settings)', () => {
  afterEach(() => {
    resetBusinessConfig();
  });

  it('counts business days in the company time zone', () => {
    // 03:30 UTC: still the 14th in Ecuador, already the 15th in Madrid.
    const now = new Date('2026-10-15T03:30:00.000Z');
    expect(todayKey(now)).toBe('2026-10-14');

    configureBusiness({ timeZone: 'Europe/Madrid' });

    expect(todayKey(now)).toBe('2026-10-15');
    expect(toZonedIsoString(now)).toBe('2026-10-15T05:30:00+02:00');
  });

  it('formats money in the company currency', () => {
    configureBusiness({ currency: 'PEN', locale: 'es-PE' });

    expect(formatCurrency(12.5)).toContain('12.50');
    expect(formatCurrency(12.5)).toMatch(/S\//);
  });

  it('keeps the current value for missing or invalid settings', () => {
    configureBusiness({ timeZone: 'Not/AZone', currency: '', defaultTaxRate: Number.NaN });

    expect(businessConfig()).toEqual(DEFAULT_BUSINESS_CONFIG);
  });
});
