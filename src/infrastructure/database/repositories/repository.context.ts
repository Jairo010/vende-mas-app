import { generateId } from '@/shared/utils/id';
import { getAppDatabase } from '../database.client';
import type { AppDatabase } from '../database.types';

/** What every SQLite repository needs; tests inject an in-memory database and fixed clock. */
export interface RepositoryContext {
  db: () => AppDatabase;
  now: () => Date;
  newId: () => string;
}

export const defaultRepositoryContext: RepositoryContext = {
  db: getAppDatabase,
  now: () => new Date(),
  newId: generateId,
};
