import { IN_TEST_COMPANY } from '../../helpers/session';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin } from '@/application/hooks/auth/use-login';
import type { IAuthRepositoryPort } from '@/core/ports/auth.repository.port';
import type { ISyncLocalStorePort } from '@/core/ports/sync.ports';
import { WebOnlyAccountError } from '@/core/errors/auth.errors';
import { secureStorageAdapter } from '@/infrastructure/storage/secure-storage.adapter';
import { mmkvStorageAdapter } from '@/infrastructure/storage/mmkv-storage.adapter';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/core/types/role.enum';
import type { AuthSession } from '@/core/types/auth.types';

describe('useLogin hook', () => {
  let queryClient: QueryClient;
  let mockRepository: jest.Mocked<IAuthRepositoryPort>;
  let localStore: jest.Mocked<ISyncLocalStorePort>;

  const mockSession: AuthSession = {
    user: {
      id: 'usr-login-test',
      email: 'seller@vendemas.com',
      name: 'Seller Test',
      role: UserRole.SELLER,
      isActive: true,
      ...IN_TEST_COMPANY,
    },
    tokens: {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    },
  };

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockRepository = {
      login: jest.fn().mockResolvedValue(mockSession),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn().mockResolvedValue(mockSession.user),
    };
    localStore = {
      applyPull: jest.fn(),
      getCursor: jest.fn(),
      setCursor: jest.fn(),
      getLastSyncedAt: jest.fn(),
      setLastSyncedAt: jest.fn(),
      clearAll: jest.fn(async () => {}),
    };
    mmkvStorageAdapter.delete(STORAGE_KEYS.LOCAL_DATA_OWNER);

    useAuthStore.getState().clearSession();
    mmkvStorageAdapter.delete(STORAGE_KEYS.REMEMBERED_EMAIL);
    jest.spyOn(secureStorageAdapter, 'setItem');
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should authenticate user, store tokens securely, and update store', async () => {
    const { result } = await renderHook(() => useLogin(mockRepository, localStore), { wrapper });

    await act(async () => {
      await result.current.loginAsync({
        email: 'seller@vendemas.com',
        password: 'password123',
        rememberMe: true,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockRepository.login).toHaveBeenCalledWith({
      email: 'seller@vendemas.com',
      password: 'password123',
      rememberMe: true,
    });

    expect(secureStorageAdapter.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.ACCESS_TOKEN,
      'test-access-token',
    );
    expect(secureStorageAdapter.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.REFRESH_TOKEN,
      'test-refresh-token',
    );

    expect(mmkvStorageAdapter.getString(STORAGE_KEYS.REMEMBERED_EMAIL)).toBe('seller@vendemas.com');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.id).toBe('usr-login-test');
  });

  it('should remove remembered email if rememberMe is false', async () => {
    mmkvStorageAdapter.setString(STORAGE_KEYS.REMEMBERED_EMAIL, 'old@vendemas.com');

    const { result } = await renderHook(() => useLogin(mockRepository, localStore), { wrapper });

    await act(async () => {
      await result.current.loginAsync({
        email: 'seller@vendemas.com',
        password: 'password123',
        rememberMe: false,
      });
    });

    expect(mmkvStorageAdapter.getString(STORAGE_KEYS.REMEMBERED_EMAIL)).toBeUndefined();
  });

  it('loads the company of the user from auth/me', async () => {
    const { result } = await renderHook(() => useLogin(mockRepository, localStore), { wrapper });

    await act(async () => {
      await result.current.loginAsync({ email: 'seller@vendemas.com', password: 'password123' });
    });

    expect(mockRepository.getCurrentUser).toHaveBeenCalled();
    expect(useAuthStore.getState().user?.company?.tradeName).toBe('Vende Más Demo');
  });

  it('turns platform accounts away and forgets their tokens', async () => {
    mockRepository.getCurrentUser.mockResolvedValue({
      ...mockSession.user,
      role: UserRole.SUPER_ADMIN,
      companyId: null,
      company: null,
      branches: [],
    });
    jest.spyOn(secureStorageAdapter, 'deleteItem');
    const { result } = await renderHook(() => useLogin(mockRepository, localStore), { wrapper });

    await act(async () => {
      await expect(
        result.current.loginAsync({ email: 'platform@vendemas.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(WebOnlyAccountError);
    });

    expect(secureStorageAdapter.deleteItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('wipes the device data when it belongs to another user or company', async () => {
    mmkvStorageAdapter.setString(STORAGE_KEYS.LOCAL_DATA_OWNER, 'someone-else:company-2');
    const { result } = await renderHook(() => useLogin(mockRepository, localStore), { wrapper });

    await act(async () => {
      await result.current.loginAsync({ email: 'seller@vendemas.com', password: 'password123' });
    });

    expect(localStore.clearAll).toHaveBeenCalled();
    expect(mmkvStorageAdapter.getString(STORAGE_KEYS.LOCAL_DATA_OWNER)).toBe(
      'usr-login-test:company-1',
    );
  });

  it('keeps the device data of the same user (unsynced changes survive)', async () => {
    mmkvStorageAdapter.setString(STORAGE_KEYS.LOCAL_DATA_OWNER, 'usr-login-test:company-1');
    const { result } = await renderHook(() => useLogin(mockRepository, localStore), { wrapper });

    await act(async () => {
      await result.current.loginAsync({ email: 'seller@vendemas.com', password: 'password123' });
    });

    expect(localStore.clearAll).not.toHaveBeenCalled();
  });
});
