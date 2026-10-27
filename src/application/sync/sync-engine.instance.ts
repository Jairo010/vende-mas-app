import { sqliteOutboxRepository } from '@/infrastructure/database/repositories/sqlite-outbox.repository';
import { sqlitePendingPhotoRepository } from '@/infrastructure/database/repositories/sqlite-pending-photo.repository';
import { sqliteSyncStoreRepository } from '@/infrastructure/database/repositories/sqlite-sync-store.repository';
import { syncApiService } from '@/infrastructure/api/services/sync-api.service';
import { netInfoNetworkAdapter } from '@/infrastructure/network/netinfo-network.adapter';
import { useAuthStore } from '@/stores/auth.store';
import { SyncEngine } from './sync-engine';

/** The app's sync engine, wired to the default adapters. */
export const syncEngine = new SyncEngine({
  outbox: sqliteOutboxRepository,
  photos: sqlitePendingPhotoRepository,
  remote: syncApiService,
  localStore: sqliteSyncStoreRepository,
  network: netInfoNetworkAdapter,
  session: {
    updateCompany: (company) => {
      useAuthStore.getState().updateCompany(company);
    },
  },
});
