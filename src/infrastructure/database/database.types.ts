import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from './schema';

export type DatabaseSchema = typeof schema;

/**
 * Driver-agnostic handle used by every SQLite repository. The app runs it on
 * expo-sqlite; tests run the same repositories on sql.js with the same migrations.
 * The session is synchronous: inside `db.transaction()` use `.run()` / `.all()` / `.get()`.
 */
export type AppDatabase = BaseSQLiteDatabase<'sync', unknown, DatabaseSchema>;
