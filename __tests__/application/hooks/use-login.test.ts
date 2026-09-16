import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin } from '@/application/hooks/auth/use-login';
import type { IAuthRepositoryPort } from '@/core/ports/auth.repository.port';
import { secureStorageAdapter } from '@/infrastructure/storage/secure-storage.adapter';
import { mmkvStorageAdapter } from '@/infrastructure/storage/mmkv-storage.adapter';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/core/types/role.enum';
import type { AuthSession } from '@/core/types/auth.types';

describe('useLogin hook', () => {
  let queryClient: QueryClient;
  let mockRepository: jest.Mocked<IAuthRepositoryPort>;

  const mockSession: AuthSession = {
    user: {
      id: 'usr-login-test',
      email: 'seller@vendemas.com',
      name: 'Seller Test',
      role: UserRole.SELLER,
      isActive: true,
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
      getCurrentUser: jest.fn(),
    };

    useAuthStore.getState().clearSession();
    mmkvStorageAdapter.delete(STORAGE_KEYS.REMEMBERED_EMAIL);
    jest.spyOn(secureStorageAdapter, 'setItem');
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should authenticate user, store tokens securely, and update store', async () => {
    const { result } = await renderHook(() => useLogin(mockRepository), { wrapper });

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

    const { result } = await renderHook(() => useLogin(mockRepository), { wrapper });

    await act(async () => {
      await result.current.loginAsync({
        email: 'seller@vendemas.com',
        password: 'password123',
        rememberMe: false,
      });
    });

    expect(mmkvStorageAdapter.getString(STORAGE_KEYS.REMEMBERED_EMAIL)).toBeUndefined();
  });
});
