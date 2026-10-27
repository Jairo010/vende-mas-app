import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { authApiService } from '@/infrastructure/api/services/auth-api.service';
import type { IAuthRepositoryPort } from '@/core/ports/auth.repository.port';
import type { ISyncLocalStorePort } from '@/core/ports/sync.ports';
import { WebOnlyAccountError } from '@/core/errors/auth.errors';
import { UserRole } from '@/core/types/role.enum';
import { needsBranchChoice } from '@/core/types/company.types';
import { sqliteSyncStoreRepository } from '@/infrastructure/database/repositories/sqlite-sync-store.repository';
import { secureStorageAdapter } from '@/infrastructure/storage/secure-storage.adapter';
import { mmkvStorageAdapter } from '@/infrastructure/storage/mmkv-storage.adapter';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import { useAuthStore } from '@/stores/auth.store';
import { claimLocalData } from '@/application/session/local-data-owner';
import type { AuthUser, LoginCredentials } from '@/core/types/auth.types';

async function clearTokens(): Promise<void> {
  await secureStorageAdapter.deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
  await secureStorageAdapter.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Signs in: stores the tokens, loads the full profile (company, branches, modules) from
 * `auth/me`, makes the device data belong to this user and opens the agenda (or, for users of
 * several branches, the branch choice). Platform
 * accounts (no company) are turned away: they work in the web CRM.
 */
export function useLogin(
  repository: IAuthRepositoryPort = authApiService,
  localStore: ISyncLocalStorePort = sqliteSyncStoreRepository,
) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation<AuthUser, Error, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // Haptics not supported or disabled on device
      }

      const session = await repository.login(credentials);
      await secureStorageAdapter.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.tokens.accessToken);
      if (session.tokens.refreshToken) {
        await secureStorageAdapter.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.tokens.refreshToken);
      }

      let user: AuthUser;
      try {
        user = await repository.getCurrentUser();
      } catch (error) {
        await clearTokens();
        throw error;
      }
      if (user.role === UserRole.SUPER_ADMIN || user.companyId === null) {
        await clearTokens();
        throw new WebOnlyAccountError();
      }

      await claimLocalData(user, localStore);
      return user;
    },
    onSuccess: async (user: AuthUser, variables: LoginCredentials) => {
      if (variables.rememberMe) {
        mmkvStorageAdapter.setString(
          STORAGE_KEYS.REMEMBERED_EMAIL,
          variables.email.trim().toLowerCase(),
        );
      } else {
        mmkvStorageAdapter.delete(STORAGE_KEYS.REMEMBERED_EMAIL);
      }

      setUser(user);

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Ignore haptic error
      }

      // Users of several branches first choose where they work.
      const { activeBranchId } = useAuthStore.getState();
      router.replace(
        needsBranchChoice(user.branches, activeBranchId) ? '/branch' : '/(app)/(tabs)/agenda',
      );
    },
    onError: async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Ignore haptic error
      }
    },
  });

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
