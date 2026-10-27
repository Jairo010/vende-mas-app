import type { CompanyProfile } from '@/core/types/company.types';

/** The company most tests run in (Ecuador defaults, every module contracted). */
export const TEST_COMPANY: CompanyProfile = {
  id: 'company-1',
  tradeName: 'Vende Más Demo',
  timezone: 'America/Guayaquil',
  currency: 'USD',
  locale: 'es-EC',
  defaultTaxRate: 0.15,
  enabledModules: ['VISITS', 'ORDERS', 'COLLECTIONS', 'ROUTES', 'PROMOTIONS'],
  logoUrl: null,
  brandColor: null,
};

/** Company part of an `AuthUser` for tests. */
export const IN_TEST_COMPANY = {
  companyId: TEST_COMPANY.id,
  company: TEST_COMPANY,
  branches: [{ id: 'branch-1', code: 'MATRIZ', name: 'Matriz', isPrimary: true }],
};
