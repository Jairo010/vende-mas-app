import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/core/types/role.enum';
import type { AuthUser } from '@/core/types/auth.types';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    useAuthStore.getState().setHydrated(false);
  });

  it('should initialize with default unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isHydrated).toBe(false);
  });

  it('should set authenticated user and update isAuthenticated', () => {
    const mockUser: AuthUser = {
      id: 'usr-999',
      email: 'test@vendemas.com',
      name: 'Test User',
      role: UserRole.SELLER,
      isActive: true,
    };

    useAuthStore.getState().setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should clear session correctly', () => {
    const mockUser: AuthUser = {
      id: 'usr-999',
      email: 'test@vendemas.com',
      name: 'Test User',
      role: UserRole.ADMIN,
      isActive: true,
    };

    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should update hydration state', () => {
    expect(useAuthStore.getState().isHydrated).toBe(false);

    useAuthStore.getState().setHydrated(true);

    expect(useAuthStore.getState().isHydrated).toBe(true);
  });
});
