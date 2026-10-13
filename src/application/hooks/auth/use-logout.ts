import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { authApiService } from '@/infrastructure/api/services/auth-api.service';
import type { IAuthRepositoryPort } from '@/core/ports/auth.repository.port';
import type { ISyncLocalStorePort } from '@/core/ports/sync.ports';
import { sqliteSyncStoreRepository } from '@/infrastructure/database/repositories/sqlite-sync-store.repository';
import { syncCoordinator } from '@/application/sync/sync-coordinator';
import { useSyncStore } from '@/stores/sync.store';
import { useVisitDraftStore } from '@/stores/visit-draft.store';
import { useOrderDraftStore } from '@/stores/order-draft.store';
import { teamApiService } from '@/infrastructure/api/services/team-api.service';
import { secureStorageAdapter } from '@/infrastructure/storage/secure-storage.adapter';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import { useAuthStore } from '@/stores/auth.store';
import { queryClient } from '@/shared/providers/query-provider';

/**
 * Signs out and wipes the device database (another seller may sign in next). Changes
 * still in the outbox are lost: the UI must warn when `pendingCount > 0`.
 */
export function useLogout(
  repository: IAuthRepositoryPort = authApiService,
  localStore: ISyncLocalStorePort = sqliteSyncStoreRepository,
) {
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

      syncCoordinator.cancelScheduled();
      try {
        await localStore.clearAll();
      } catch {
        // The next sign-in downloads the working set again
      }
      useSyncStore.getState().reset();
      useVisitDraftStore.getState().clearAll();
      useOrderDraftStore.getState().clearAll();
      teamApiService.clearCache();

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
