import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogout } from '@/application/hooks/auth/use-logout';
import type { IAuthRepositoryPort } from '@/core/ports/auth.repository.port';
import { secureStorageAdapter } from '@/infrastructure/storage/secure-storage.adapter';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/core/types/role.enum';

describe('useLogout hook', () => {
  let queryClient: QueryClient;
  let mockRepository: jest.Mocked<IAuthRepositoryPort>;

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
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
      getCurrentUser: jest.fn(),
    };

    useAuthStore.getState().setUser({
      id: 'usr-logout',
      email: 'user@vendemas.com',
      name: 'Logged In User',
      role: UserRole.SELLER,
      isActive: true,
    });
    jest.spyOn(secureStorageAdapter, 'deleteItem');
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should clear secure tokens, reset auth store session, and call repository logout', async () => {
    const { result } = await renderHook(() => useLogout(mockRepository), { wrapper });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logoutAsync();
    });

    expect(mockRepository.logout).toHaveBeenCalled();
    expect(secureStorageAdapter.deleteItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    expect(secureStorageAdapter.deleteItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
