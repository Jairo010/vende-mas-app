/** `company` of `GET /auth/me` and of every `GET /sync/pull` page. */
export interface CompanyProfileDto {
  id?: string;
  tradeName?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  defaultTaxRate?: number;
  enabledModules?: string[];
  logoUrl?: string | null;
  brandColor?: string | null;
}

/** `branches[]` of `GET /auth/me`. */
export interface UserBranchDto {
  id?: string;
  code?: string;
  name?: string;
  isPrimary?: boolean;
}
