import { asc, eq, sql } from 'drizzle-orm';
import type { IPendingPhotoPort } from '@/core/ports/sync.ports';
import type { PendingPhoto } from '@/core/types/sync.types';
import { pendingPhotos } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

export class SqlitePendingPhotoRepository implements IPendingPhotoPort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async listToUpload(): Promise<PendingPhoto[]> {
    return this.ctx
      .db()
      .select({
        id: pendingPhotos.id,
        localUri: pendingPhotos.localUri,
        remoteUrl: pendingPhotos.remoteUrl,
        attempts: pendingPhotos.attempts,
      })
      .from(pendingPhotos)
      .where(sql`${pendingPhotos.remoteUrl} IS NULL`)
      .orderBy(asc(pendingPhotos.createdAt))
      .all();
  }

  public async findRemoteUrl(photoId: string): Promise<string | null> {
    const row = this.ctx
      .db()
      .select({ remoteUrl: pendingPhotos.remoteUrl })
      .from(pendingPhotos)
      .where(eq(pendingPhotos.id, photoId))
      .get();
    return row?.remoteUrl ?? null;
  }

  public async markUploaded(photoId: string, remoteUrl: string): Promise<void> {
    this.ctx
      .db()
      .update(pendingPhotos)
      .set({ remoteUrl, lastError: null })
      .where(eq(pendingPhotos.id, photoId))
      .run();
  }

  public async markFailed(photoId: string, error: string): Promise<void> {
    this.ctx
      .db()
      .update(pendingPhotos)
      .set({ attempts: sql`${pendingPhotos.attempts} + 1`, lastError: error })
      .where(eq(pendingPhotos.id, photoId))
      .run();
  }
}

export const sqlitePendingPhotoRepository = new SqlitePendingPhotoRepository();
