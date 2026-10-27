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

/**
 * Branch the user works in: the chosen one if it is still theirs, the only one when they have
 * a single branch, otherwise none yet (they must choose).
 */
export function resolveActiveBranch(
  branches: readonly UserBranch[],
  chosenId: string | null,
): string | null {
  if (chosenId && branches.some((branch) => branch.id === chosenId)) return chosenId;
  return branches.length === 1 ? (branches[0]?.id ?? null) : null;
}

/** A user of several branches must pick one before working (and can switch later). */
export function needsBranchChoice(
  branches: readonly UserBranch[],
  activeId: string | null,
): boolean {
  return branches.length > 1 && activeId === null;
}
