import type { MMKV } from 'react-native-mmkv';
import type { IStoragePort } from '@/core/ports/storage.port';

const memoryStore = new Map<string, string | boolean>();

let mmkvInstance: MMKV | null = null;

try {
  // Use dynamic require so that in Expo Go (where native NitroModules is absent),
  // the failure is caught gracefully without crashing module evaluation.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mmkvModule = require('react-native-mmkv') as { createMMKV?: () => MMKV };
  if (mmkvModule && typeof mmkvModule.createMMKV === 'function') {
    mmkvInstance = mmkvModule.createMMKV();
  }
} catch {
  // In Expo Go or test environments without native binary, gracefully fallback to in-memory store
}

export const mmkvStorageAdapter: IStoragePort = {
  getString: (key: string) => {
    if (mmkvInstance) {
      return mmkvInstance.getString(key);
    }
    const val = memoryStore.get(key);
    return typeof val === 'string' ? val : undefined;
  },
  setString: (key: string, value: string) => {
    if (mmkvInstance) {
      mmkvInstance.set(key, value);
    } else {
      memoryStore.set(key, value);
    }
  },
  getBoolean: (key: string) => {
    if (mmkvInstance) {
      return mmkvInstance.getBoolean(key);
    }
    const val = memoryStore.get(key);
    return typeof val === 'boolean' ? val : undefined;
  },
  setBoolean: (key: string, value: boolean) => {
    if (mmkvInstance) {
      mmkvInstance.set(key, value);
    } else {
      memoryStore.set(key, value);
    }
  },
  delete: (key: string) => {
    if (mmkvInstance) {
      mmkvInstance.remove(key);
    } else {
      memoryStore.delete(key);
    }
  },
  clearAll: () => {
    if (mmkvInstance) {
      mmkvInstance.clearAll();
    } else {
      memoryStore.clear();
    }
  },
};

// Zustand persist middleware storage adapter
export const zustandMmkvStorage = {
  setItem: (key: string, value: string) => {
    if (mmkvInstance) {
      mmkvInstance.set(key, value);
    } else {
      memoryStore.set(key, value);
    }
  },
  getItem: (key: string) => {
    if (mmkvInstance) {
      return mmkvInstance.getString(key) ?? null;
    }
    const val = memoryStore.get(key);
    return typeof val === 'string' ? val : null;
  },
  removeItem: (key: string) => {
    if (mmkvInstance) {
      mmkvInstance.remove(key);
    } else {
      memoryStore.delete(key);
    }
  },
};
