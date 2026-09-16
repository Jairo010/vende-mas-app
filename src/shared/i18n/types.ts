import type { es } from './es';

export type TranslationKey = typeof es;

export type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K;
    }[keyof T & string]
  : never;

export type TranslationPath = NestedKeyOf<TranslationKey>;
