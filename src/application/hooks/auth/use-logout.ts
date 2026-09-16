import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { authApiService } from '@/infrastructure/api/services/auth-api.service';
import type { IAuthRepositoryPort } from '@/core/ports/auth.repository.port';
import { secureStorageAdapter } from '@/infrastructure/storage/secure-storage.adapter';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import { useAuthStore } from '@/stores/auth.store';
import { queryClient } from '@/shared/providers/query-provider';

export function useLogout(repository: IAuthRepositoryPort = authApiService) {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  const mutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      let refreshToken: string | null = null;
      try {
        refreshToken = await secureStorageAdapter.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      } catch {
        // Continue logout even if token read fails
      }

      await repository.logout(refreshToken ?? undefined);
    },
    onSettled: async () => {
      try {
        await secureStorageAdapter.deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
        await secureStorageAdapter.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
      } catch {
        // Local cleanup
      }

      clearSession();
      queryClient.clear();

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Ignore haptics error
      }

      router.replace('/(auth)/login');
    },
  });

  return {
    logout: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
