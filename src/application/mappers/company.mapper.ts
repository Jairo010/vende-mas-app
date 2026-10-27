import {
  COMPANY_MODULES,
  type CompanyModule,
  type CompanyProfile,
  type UserBranch,
} from '@/core/types/company.types';
import { DEFAULT_BUSINESS_CONFIG } from '@/shared/config/business-config';
import type { CompanyProfileDto, UserBranchDto } from '@/infrastructure/api/dto/company.dto';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export class CompanyMapper {
  /** Null when the API sent no company (platform staff) or an unusable one. */
  public static toProfile(dto: CompanyProfileDto | null | undefined): CompanyProfile | null {
    if (!dto?.id) return null;
    return {
      id: dto.id,
      tradeName: dto.tradeName ?? '',
      timezone: dto.timezone || DEFAULT_BUSINESS_CONFIG.timeZone,
      currency: dto.currency || DEFAULT_BUSINESS_CONFIG.currency,
      locale: dto.locale || DEFAULT_BUSINESS_CONFIG.locale,
      defaultTaxRate:
        typeof dto.defaultTaxRate === 'number'
          ? dto.defaultTaxRate
          : DEFAULT_BUSINESS_CONFIG.defaultTaxRate,
      // Unknown modules (added on the server later) are ignored until the app knows them.
      enabledModules: (dto.enabledModules ?? []).filter((module): module is CompanyModule =>
        (COMPANY_MODULES as readonly string[]).includes(module),
      ),
      logoUrl: dto.logoUrl ?? null,
      brandColor: dto.brandColor && HEX_COLOR.test(dto.brandColor) ? dto.brandColor : null,
    };
  }

  public static toBranches(dtos: UserBranchDto[] | null | undefined): UserBranch[] {
    return (dtos ?? [])
      .filter((dto): dto is UserBranchDto & { id: string } => Boolean(dto.id))
      .map((dto) => ({
        id: dto.id,
        code: dto.code ?? '',
        name: dto.name ?? '',
        isPrimary: dto.isPrimary === true,
      }));
  }
}
