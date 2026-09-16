import * as SecureStore from 'expo-secure-store';
import type { ISecureStoragePort } from '@/core/ports/secure-storage.port';

export const secureStorageAdapter: ISecureStoragePort = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  deleteItem: (key: string) => SecureStore.deleteItemAsync(key),
};
