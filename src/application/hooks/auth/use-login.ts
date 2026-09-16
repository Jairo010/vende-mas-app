import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { authApiService } from '@/infrastructure/api/services/auth-api.service';
import type { IAuthRepositoryPort } from '@/core/ports/auth.repository.port';
import { secureStorageAdapter } from '@/infrastructure/storage/secure-storage.adapter';
import { mmkvStorageAdapter } from '@/infrastructure/storage/mmkv-storage.adapter';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthSession, LoginCredentials } from '@/core/types/auth.types';

export function useLogin(repository: IAuthRepositoryPort = authApiService) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation<AuthSession, Error, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // Haptics not supported or disabled on device
      }

      return repository.login(credentials);
    },
    onSuccess: async (session: AuthSession, variables: LoginCredentials) => {
      await secureStorageAdapter.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.tokens.accessToken);
      if (session.tokens.refreshToken) {
        await secureStorageAdapter.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.tokens.refreshToken);
      }

      if (variables.rememberMe) {
        mmkvStorageAdapter.setString(
          STORAGE_KEYS.REMEMBERED_EMAIL,
          variables.email.trim().toLowerCase(),
        );
      } else {
        mmkvStorageAdapter.delete(STORAGE_KEYS.REMEMBERED_EMAIL);
      }

      setUser(session.user);

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Ignore haptic error
      }

      router.replace('/(tabs)');
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
