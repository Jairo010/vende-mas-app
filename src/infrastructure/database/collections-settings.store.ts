import { eq } from 'drizzle-orm';
import {
  DEFAULT_COLLECTIONS_SETTINGS,
  type CollectionsSettings,
} from '@/core/types/collection.types';
import type { DbExecutor } from './outbox-writer';
import { syncMeta } from './schema';

const META_COLLECTIONS_SETTINGS = 'collections_settings';

/** Credit rules received in the last pull (defaults until the first one). */
export function readCollectionsSettings(db: DbExecutor): CollectionsSettings {
  const row = db.select().from(syncMeta).where(eq(syncMeta.key, META_COLLECTIONS_SETTINGS)).get();
  if (!row) return DEFAULT_COLLECTIONS_SETTINGS;
  try {
    const parsed = JSON.parse(row.value) as Partial<CollectionsSettings>;
    return {
      blockOrdersWhenOverdue:
        typeof parsed.blockOrdersWhenOverdue === 'boolean'
          ? parsed.blockOrdersWhenOverdue
          : DEFAULT_COLLECTIONS_SETTINGS.blockOrdersWhenOverdue,
      overdueGraceDays: Math.max(0, Number(parsed.overdueGraceDays) || 0),
    };
  } catch {
    return DEFAULT_COLLECTIONS_SETTINGS;
  }
}

export function writeCollectionsSettings(db: DbExecutor, settings: CollectionsSettings): void {
  const value = JSON.stringify(settings);
  db.insert(syncMeta)
    .values({ key: META_COLLECTIONS_SETTINGS, value })
    .onConflictDoUpdate({ target: syncMeta.key, set: { value } })
    .run();
}
