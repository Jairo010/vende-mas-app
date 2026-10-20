/// <reference types="node" />
import path from 'path';
import initSqlJs from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import * as schema from '@/infrastructure/database/schema';
import type { AppDatabase } from '@/infrastructure/database/database.types';
import type { RepositoryContext } from '@/infrastructure/database/repositories/repository.context';

const MIGRATIONS_FOLDER = path.join(__dirname, '../../src/infrastructure/database/migrations');

/**
 * In-memory SQLite (sql.js) with the app's real Drizzle migrations, so repository tests
 * run actual SQL instead of mocking the database.
 */
export async function createTestDatabase(): Promise<AppDatabase> {
  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(__dirname, '../../node_modules/sql.js/dist', file),
  });
  const client = new SQL.Database();
  client.run('PRAGMA foreign_keys = ON;');
  const db = drizzle(client, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db as unknown as AppDatabase;
}

/** Deterministic ids (`id-1`, `id-2`, ...) unless a UUID is needed. */
export function sequentialIds(prefix = 'id'): () => string {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
}

export function createTestContext(
  db: AppDatabase,
  now: Date = new Date('2026-10-14T14:30:00.000Z'),
): RepositoryContext & { setNow: (date: Date) => void } {
  let current = now;
  return {
    db: () => db,
    now: () => current,
    newId: sequentialIds(),
    setNow: (date: Date) => {
      current = date;
    },
  };
}
