import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import type { AppDatabase } from './database.types';

export const DATABASE_NAME = 'vende-mas.db';

let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

/** Opens the local database once (lazily, so importing this file never touches the disk). */
export function getDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (!database) {
    const client = openDatabaseSync(DATABASE_NAME);
    client.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    database = drizzle(client, { schema });
  }
  return database;
}

export function getAppDatabase(): AppDatabase {
  return getDatabase();
}
