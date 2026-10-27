import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';
import type { AuthUser } from '@/core/types/auth.types';
import { type CompanyProfile, resolveActiveBranch } from '@/core/types/company.types';
import { configureBusiness, resetBusinessConfig } from '@/shared/config/business-config';

/** Why the app signed the user out on its own (shown on the login screen). */
export type SignOutReason = 'SESSION_EXPIRED' | 'COMPANY_SUSPENDED' | 'BRANCH_REMOVED';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  signOutReason: SignOutReason | null;
  /** Branch the user works in (sent as `X-Branch-Id`); null until chosen. */
  activeBranchId: string | null;
  setUser: (user: AuthUser) => void;
  /** Fresh company settings (every sync pull brings them): modules, zone, currency, brand. */
  updateCompany: (company: CompanyProfile) => void;
  /** Works in another of the user's branches (ignored if it is not theirs). */
  setActiveBranch: (branchId: string) => void;
  clearSession: (reason?: SignOutReason) => void;
  setHydrated: (hydrated: boolean) => void;
}

/** Dates and money follow the company of the session. */
function applyCompany(company: CompanyProfile | null): void {
  if (!company) {
    resetBusinessConfig();
    return;
  }
  configureBusiness({
    timeZone: company.timezone,
    locale: company.locale,
    currency: company.currency,
    defaultTaxRate: company.defaultTaxRate,
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      signOutReason: null,
      activeBranchId: null,
      setUser: (user) => {
        applyCompany(user.company);
        set({
          user,
          isAuthenticated: true,
          signOutReason: null,
          activeBranchId: resolveActiveBranch(user.branches, get().activeBranchId),
        });
      },
      setActiveBranch: (branchId) => {
        const { user } = get();
        if (!user?.branches.some((branch) => branch.id === branchId)) return;
        set({ activeBranchId: branchId });
      },
      updateCompany: (company) => {
        const { user } = get();
        // A pull of another company (stale request after switching users) is ignored.
        if (!user || (user.companyId !== null && user.companyId !== company.id)) return;
        applyCompany(company);
        set({ user: { ...user, companyId: company.id, company } });
      },
      clearSession: (reason) => {
        resetBusinessConfig();
        // A reason only makes sense if someone was signed in (a failed request before login
        // must not say "your session expired").
        const signOutReason = get().isAuthenticated ? (reason ?? null) : null;
        set({ user: null, isAuthenticated: false, signOutReason, activeBranchId: null });
      },
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeBranchId: state.activeBranchId,
      }),
      onRehydrateStorage: () => (state) => {
        // Sessions stored before multi-tenancy have no company: the defaults apply until the
        // next sync pull brings it.
        if (state?.user && state.isAuthenticated) {
          state.setUser({
            ...state.user,
            companyId: state.user.companyId ?? null,
            company: state.user.company ?? null,
            branches: state.user.branches ?? [],
          });
        }
        state?.setHydrated(true);
      },
    },
  ),
);
