import { DomainError } from '@/core/errors/domain.error';
import type {
  ICompanySessionPort,
  INetworkStatusPort,
  IOutboxPort,
  IPendingPhotoPort,
  ISyncLocalStorePort,
  ISyncRemotePort,
} from '@/core/ports/sync.ports';
import type {
  OutboxOperation,
  SyncError,
  SyncPushOperation,
  SyncRunSummary,
} from '@/core/types/sync.types';

/** API limit per push (docs/sync-protocol.md). */
export const PUSH_BATCH_SIZE = 100;
/** After this many failed uploads the operation is sent without the photo (the server decides). */
export const MAX_PHOTO_ATTEMPTS = 5;
/** Safety net against a server that keeps answering `hasMore`. */
const MAX_PULL_PAGES = 50;

export type SyncStopReason = 'OFFLINE' | 'UNAUTHORIZED' | 'SERVER_ERROR';

export interface SyncEngineDependencies {
  outbox: IOutboxPort;
  photos: IPendingPhotoPort;
  remote: ISyncRemotePort;
  localStore: ISyncLocalStorePort;
  network: INetworkStatusPort;
  /** Keeps the session company up to date (modules, zone, currency, brand). */
  session?: ICompanySessionPort;
  now?: () => Date;
}

class SyncStoppedError extends Error {
  constructor(public readonly reason: SyncStopReason) {
    super(reason);
  }
}

/** Network down, session expired or server outage: stop and try again later. */
function toStopReason(error: unknown): SyncStopReason | null {
  if (!(error instanceof DomainError)) return null;
  if (error.code === 'NETWORK_ERROR') return 'OFFLINE';
  if (error.statusCode === 401) return 'UNAUTHORIZED';
  if (error.statusCode === 0 || error.statusCode >= 500 || error.statusCode === 429) {
    return 'SERVER_ERROR';
  }
  return null;
}

function toSyncError(error: unknown): SyncError {
  if (error instanceof DomainError) return { code: error.code, message: error.message };
  return { code: 'UNKNOWN', message: error instanceof Error ? error.message : String(error) };
}

/**
 * Drives the offline protocol (ADR 0003, API docs/sync-protocol.md):
 * 1. uploads photos taken offline (`photoId` makes retries idempotent);
 * 2. pushes queued operations in the order they happened, in batches;
 * 3. pulls server changes from the saved cursor until `hasMore` is false.
 *
 * Runs are single-flight: calling `run()` while one is active returns the same promise.
 */
export class SyncEngine {
  private current: Promise<SyncRunSummary> | null = null;
  private readonly now: () => Date;

  constructor(private readonly deps: SyncEngineDependencies) {
    this.now = deps.now ?? (() => new Date());
  }

  public run(): Promise<SyncRunSummary> {
    if (!this.current) {
      this.current = this.execute().finally(() => {
        this.current = null;
      });
    }
    return this.current;
  }

  public isRunning(): boolean {
    return this.current !== null;
  }

  private async execute(): Promise<SyncRunSummary> {
    const summary: SyncRunSummary = {
      pushed: 0,
      rejected: 0,
      pending: 0,
      pulled: false,
      error: null,
    };

    try {
      if (!(await this.deps.network.isOnline())) throw new SyncStoppedError('OFFLINE');
      const photoAttempts = await this.uploadPendingPhotos();
      await this.pushOutbox(summary, photoAttempts);
      await this.pullChanges();
      summary.pulled = true;
      await this.deps.localStore.setLastSyncedAt(this.now().toISOString());
    } catch (error) {
      if (!(error instanceof SyncStoppedError)) throw error;
      summary.error = error.reason;
    } finally {
      summary.pending = await this.deps.outbox.countPending();
    }
    return summary;
  }

  /** Returns failed attempts per photo still waiting, so the push can decide what to do. */
  private async uploadPendingPhotos(): Promise<Map<string, number>> {
    const waiting = new Map<string, number>();
    for (const photo of await this.deps.photos.listToUpload()) {
      try {
        const url = await this.deps.remote.uploadPhoto(photo.id, photo.localUri);
        await this.deps.photos.markUploaded(photo.id, url);
      } catch (error) {
        const reason = toStopReason(error);
        if (reason) throw new SyncStoppedError(reason);
        await this.deps.photos.markFailed(photo.id, toSyncError(error).message);
        waiting.set(photo.id, photo.attempts + 1);
      }
    }
    return waiting;
  }

  private async pushOutbox(
    summary: SyncRunSummary,
    photoAttempts: Map<string, number>,
  ): Promise<void> {
    for (;;) {
      const queued = await this.deps.outbox.listPending(PUSH_BATCH_SIZE);
      if (queued.length === 0) return;

      const { batch, blocked } = await this.buildBatch(queued, photoAttempts);
      if (batch.length === 0) return;

      let results;
      try {
        results = await this.deps.remote.push(batch.map(({ operation }) => operation));
      } catch (error) {
        const reason = toStopReason(error);
        throw new SyncStoppedError(reason ?? 'SERVER_ERROR');
      }

      const bySeq = new Map(batch.map(({ seq, operation }) => [operation.idempotencyKey, seq]));
      let mustStop = blocked;
      for (const result of results) {
        const seq = bySeq.get(result.idempotencyKey);
        if (seq === undefined) continue;
        switch (result.status) {
          case 'APPLIED':
          case 'DUPLICATE':
            await this.deps.outbox.markAccepted(seq, result.data);
            summary.pushed += 1;
            break;
          case 'REJECTED':
            await this.deps.outbox.markRejected(
              seq,
              result.error ?? { code: 'REJECTED', message: 'Rechazado por el servidor' },
            );
            summary.rejected += 1;
            break;
          case 'RETRY':
            await this.deps.outbox.markRetry(seq, result.error ?? null);
            mustStop = true;
            break;
          case 'SKIPPED':
            mustStop = true;
            break;
        }
      }

      // Transient problems: keep the order and let a later run continue from here.
      if (mustStop || queued.length < PUSH_BATCH_SIZE) return;
    }
  }

  /**
   * Turns queued operations into push operations, injecting uploaded photo URLs. Stops at
   * the first operation whose photo is not uploaded yet, so later ones keep their order.
   */
  private async buildBatch(
    queued: OutboxOperation[],
    photoAttempts: Map<string, number>,
  ): Promise<{ batch: { seq: number; operation: SyncPushOperation }[]; blocked: boolean }> {
    const batch: { seq: number; operation: SyncPushOperation }[] = [];
    for (const op of queued) {
      const payload = { ...op.payload };
      if (op.photoId && op.photoField) {
        const url = await this.deps.photos.findRemoteUrl(op.photoId);
        if (url) {
          payload[op.photoField] = url;
        } else if ((photoAttempts.get(op.photoId) ?? 0) < MAX_PHOTO_ATTEMPTS) {
          return { batch, blocked: true };
        }
      }
      batch.push({
        seq: op.seq,
        operation: {
          idempotencyKey: op.idempotencyKey,
          entityType: op.entityType,
          entityId: op.entityId,
          action: op.action,
          clientTimestamp: op.clientTimestamp,
          payload,
        },
      });
    }
    return { batch, blocked: false };
  }

  private async pullChanges(): Promise<void> {
    let cursor = await this.deps.localStore.getCursor();
    let resetOnce = false;

    for (let page = 0; page < MAX_PULL_PAGES; page += 1) {
      let changes;
      try {
        changes = await this.deps.remote.pull(cursor);
      } catch (error) {
        const reason = toStopReason(error);
        if (reason) throw new SyncStoppedError(reason);
        // Invalid or outdated cursor (400): download the working set again.
        if (cursor && !resetOnce) {
          resetOnce = true;
          cursor = null;
          await this.deps.localStore.setCursor(null);
          continue;
        }
        throw new SyncStoppedError('SERVER_ERROR');
      }

      await this.deps.localStore.applyPull(changes);
      if (changes.company) this.deps.session?.updateCompany(changes.company);
      await this.deps.localStore.setCursor(changes.cursor);
      cursor = changes.cursor;
      if (!changes.hasMore) return;
    }
  }
}
