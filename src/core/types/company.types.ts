/** Contracted modules of a company: features of a missing one are hidden. */
export const COMPANY_MODULES = ['VISITS', 'ORDERS', 'COLLECTIONS', 'ROUTES', 'PROMOTIONS'] as const;
export type CompanyModule = (typeof COMPANY_MODULES)[number];

/** The company the session belongs to, as `auth/me` and every sync pull describe it. */
export interface CompanyProfile {
  id: string;
  tradeName: string;
  /** IANA zone: business days are counted in it. */
  timezone: string;
  /** ISO 4217. */
  currency: string;
  /** BCP 47. */
  locale: string;
  /** Default VAT as a fraction (0.15). */
  defaultTaxRate: number;
  enabledModules: CompanyModule[];
  logoUrl: string | null;
  /** `#rrggbb`; replaces the primary color of the app when set. */
  brandColor: string | null;
}

/** A branch the user works in (records are assigned to the primary one by the server). */
export interface UserBranch {
  id: string;
  code: string;
  name: string;
  isPrimary: boolean;
}

export function hasModule(company: CompanyProfile | null, module: CompanyModule): boolean {
  return company?.enabledModules.includes(module) ?? false;
}
