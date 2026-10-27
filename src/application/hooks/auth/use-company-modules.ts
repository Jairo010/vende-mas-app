import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import type { CompanyModule } from '@/core/types/company.types';

export interface UseCompanyModulesResult {
  /** Whether the company contracted `module` (its screens and actions are shown). */
  has: (module: CompanyModule) => boolean;
}

/**
 * Contracted modules of the session's company. Features of a missing module are hidden (the
 * API rejects them anyway). Until the company is known (a session stored before
 * multi-tenancy, refreshed by the next sync) nothing is hidden, as before.
 */
export function useCompanyModules(): UseCompanyModulesResult {
  const modules = useAuthStore((state) => state.user?.company?.enabledModules ?? null);
  const has = useCallback(
    (module: CompanyModule) => modules === null || modules.includes(module),
    [modules],
  );
  return { has };
}
