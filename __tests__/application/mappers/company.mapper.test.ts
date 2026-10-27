import { CompanyMapper } from '@/application/mappers/company.mapper';

describe('CompanyMapper', () => {
  it('maps the company profile and ignores modules the app does not know', () => {
    const profile = CompanyMapper.toProfile({
      id: 'company-2',
      tradeName: 'Distribuidora Andina',
      timezone: 'America/Guayaquil',
      currency: 'USD',
      locale: 'es-EC',
      defaultTaxRate: 0.15,
      enabledModules: ['VISITS', 'ORDERS', 'LOYALTY'],
      logoUrl: null,
      brandColor: '#1D4ED8',
    });

    expect(profile).toEqual(
      expect.objectContaining({
        id: 'company-2',
        enabledModules: ['VISITS', 'ORDERS'],
        brandColor: '#1D4ED8',
      }),
    );
  });

  it('drops an invalid brand color and fills missing settings with the defaults', () => {
    const profile = CompanyMapper.toProfile({ id: 'company-3', brandColor: 'red' });

    expect(profile).toMatchObject({
      brandColor: null,
      timezone: 'America/Guayaquil',
      currency: 'USD',
    });
  });

  it('returns null without a company (platform staff)', () => {
    expect(CompanyMapper.toProfile(null)).toBeNull();
    expect(CompanyMapper.toProfile({})).toBeNull();
  });
});
