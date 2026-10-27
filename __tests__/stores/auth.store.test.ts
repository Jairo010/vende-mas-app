import { businessConfig } from '@/shared/config/business-config';
import { IN_TEST_COMPANY } from '../helpers/session';
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
      ...IN_TEST_COMPANY,
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
      ...IN_TEST_COMPANY,
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

describe('useAuthStore company settings', () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('applies the company of the session to dates and money, and resets them on sign-out', () => {
    useAuthStore.getState().setUser({
      id: 'usr-1',
      email: 'seller@vendemas.com',
      name: 'Seller',
      role: UserRole.SELLER,
      isActive: true,
      ...IN_TEST_COMPANY,
      company: { ...IN_TEST_COMPANY.company, currency: 'PEN', timezone: 'America/Lima' },
    });

    expect(businessConfig()).toMatchObject({ currency: 'PEN', timeZone: 'America/Lima' });

    useAuthStore.getState().clearSession('COMPANY_SUSPENDED');

    expect(businessConfig().currency).toBe('USD');
    expect(useAuthStore.getState().signOutReason).toBe('COMPANY_SUSPENDED');
  });

  it('takes the fresh company of a pull, but not one of another company', () => {
    useAuthStore.getState().setUser({
      id: 'usr-1',
      email: 'seller@vendemas.com',
      name: 'Seller',
      role: UserRole.SELLER,
      isActive: true,
      ...IN_TEST_COMPANY,
    });

    useAuthStore
      .getState()
      .updateCompany({ ...IN_TEST_COMPANY.company, enabledModules: ['VISITS'] });
    useAuthStore.getState().updateCompany({ ...IN_TEST_COMPANY.company, id: 'company-9' });

    expect(useAuthStore.getState().user?.company?.enabledModules).toEqual(['VISITS']);
    expect(useAuthStore.getState().user?.companyId).toBe('company-1');
  });
});

describe('useAuthStore sign-out reason', () => {
  it('is not set when nobody was signed in', () => {
    useAuthStore.getState().clearSession();
    useAuthStore.getState().clearSession('SESSION_EXPIRED');

    expect(useAuthStore.getState().signOutReason).toBeNull();
  });
});
