import type { ISyncLocalStorePort } from '@/core/ports/sync.ports';
import type { AuthUser } from '@/core/types/auth.types';
import { mmkvStorageAdapter } from '@/infrastructure/storage/mmkv-storage.adapter';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import { useOrderDraftStore } from '@/stores/order-draft.store';
import { useRoutePlanStore } from '@/stores/route-plan.store';
import { useVisitDraftStore } from '@/stores/visit-draft.store';

/** Who the device database belongs to: a seller of a company. */
export function localDataOwner(user: Pick<AuthUser, 'id' | 'companyId'>): string {
  return `${user.id}:${user.companyId ?? ''}`;
}

/**
 * Makes the device data belong to `user` before they see it. Logging out already wipes it,
 * but a session can also end on its own (expired, company suspended) and someone else sign
 * in next: their data must never mix with the previous user's or another company's.
 *
 * @returns whether the local data had to be wiped.
 */
export async function claimLocalData(
  user: Pick<AuthUser, 'id' | 'companyId'>,
  localStore: ISyncLocalStorePort,
): Promise<boolean> {
  const owner = localDataOwner(user);
  const previous = mmkvStorageAdapter.getString(STORAGE_KEYS.LOCAL_DATA_OWNER);
  // No owner recorded: a database from before this check. Keep it (it is the same seller who
  // updated the app, and it may hold changes not synced yet).
  const wipe = previous !== undefined && previous !== owner;
  if (wipe) {
    await localStore.clearAll();
    useVisitDraftStore.getState().clearAll();
    useOrderDraftStore.getState().clearAll();
    useRoutePlanStore.getState().clearAll();
  }
  mmkvStorageAdapter.setString(STORAGE_KEYS.LOCAL_DATA_OWNER, owner);
  return wipe;
}

/** After logout the database is empty: nobody owns it. */
export function releaseLocalData(): void {
  mmkvStorageAdapter.delete(STORAGE_KEYS.LOCAL_DATA_OWNER);
}
