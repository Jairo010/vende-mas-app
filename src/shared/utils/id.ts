import { randomUUID } from 'expo-crypto';

/**
 * UUID v4 for everything the app creates offline (customers, visits, orders, photos).
 * The server keeps the same id, so later operations can reference it before the sync.
 */
export function generateId(): string {
  return randomUUID();
}
