import type { CustomerEntity } from '../entities/customer.entity';
import type { OrderEntity } from '../entities/order.entity';
import type { ProductEntity } from '../entities/product.entity';
import type { VisitEntity } from '../entities/visit.entity';
import type { Category, Promotion } from '../types/catalog.types';
import type {
  OutboxOperation,
  PendingPhoto,
  SyncError,
  SyncPushOperation,
  SyncPushResult,
} from '../types/sync.types';

/** Queue of local mutations (written by the repositories, drained by the sync engine). */
export interface IOutboxPort {
  /** Pending operations in the order they happened. */
  listPending(limit: number): Promise<OutboxOperation[]>;
  listRejected(): Promise<OutboxOperation[]>;
  countPending(): Promise<number>;
  /** Accepted by the server: remove it and refresh the entity's local sync status. */
  markAccepted(seq: number, data?: unknown): Promise<void>;
  /** Refused for good: keep it (with the reason) so the seller can see and fix it. */
  markRejected(seq: number, error: SyncError): Promise<void>;
  /** Transient failure: keep it for the next run. */
  markRetry(seq: number, error: SyncError | null): Promise<void>;
  /** The seller dismisses a rejected operation. */
  discard(seq: number): Promise<void>;
}

/** Photos taken offline that must be uploaded before the operations that use them. */
export interface IPendingPhotoPort {
  listToUpload(): Promise<PendingPhoto[]>;
  findRemoteUrl(photoId: string): Promise<string | null>;
  markUploaded(photoId: string, remoteUrl: string): Promise<void>;
  markFailed(photoId: string, error: string): Promise<void>;
}

/** Durable copy of photos on the device (camera files live in a temporary cache). */
export interface IPhotoFileStoragePort {
  /** Copies the picture into app storage and returns the durable URI. */
  persist(sourceUri: string, photoId: string): Promise<string>;
  remove(localUri: string): Promise<void>;
}

/** One page of server changes from `GET /sync/pull`, already mapped to the domain. */
export interface SyncChangeSet {
  serverTime: string;
  cursor: string;
  hasMore: boolean;
  visits: VisitEntity[];
  customers: CustomerEntity[];
  /** Tombstones: customers deleted on the server. */
  deletedCustomerIds: string[];
  orders: OrderEntity[];
  /** Includes inactive products (hidden locally). */
  products: ProductEntity[];
  categories: Category[];
  /** Full list of active promotions: replaces the local one. */
  promotions: Promotion[];
}

/** Remote side of the sync protocol (docs/sync-protocol.md in the API). */
export interface ISyncRemotePort {
  push(operations: SyncPushOperation[]): Promise<SyncPushResult[]>;
  pull(cursor: string | null): Promise<SyncChangeSet>;
  /** `POST /files/photos` with the client `photoId` (idempotent); returns the server URL. */
  uploadPhoto(photoId: string, localUri: string): Promise<string>;
}

/** Applies pulled changes to the device database and keeps sync bookkeeping. */
export interface ISyncLocalStorePort {
  applyPull(changes: SyncChangeSet): Promise<void>;
  getCursor(): Promise<string | null>;
  setCursor(cursor: string | null): Promise<void>;
  getLastSyncedAt(): Promise<string | null>;
  setLastSyncedAt(at: string): Promise<void>;
  /** Wipes every local table (logout / another user signs in). */
  clearAll(): Promise<void>;
}

export interface INetworkStatusPort {
  isOnline(): Promise<boolean>;
  /** Calls `listener` whenever connectivity changes; returns the unsubscribe function. */
  subscribe(listener: (online: boolean) => void): () => void;
}
