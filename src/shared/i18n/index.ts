import { es } from './es';
import type { TranslationPath, TranslationKey } from './types';

export function t(path: TranslationPath): string {
  const keys = path.split('.');
  let result: unknown = es;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof result === 'string' ? result : path;
}

export { es };
export type { TranslationKey, TranslationPath };
