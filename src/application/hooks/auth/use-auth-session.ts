import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/core/types/role.enum';
import type { AuthUser } from '@/core/types/auth.types';

export interface UseAuthSessionResult {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  isSeller: boolean;
}

export function useAuthSession(): UseAuthSessionResult {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isSupervisor = user?.role === UserRole.SUPERVISOR;
  const isSeller = user?.role === UserRole.SELLER;

  return {
    user,
    isAuthenticated,
    isHydrated,
    isAdmin,
    isSupervisor,
    isSeller,
  };
}
