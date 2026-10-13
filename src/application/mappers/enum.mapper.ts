/** Narrows an API string to a known enum value, or `fallback` if the API sent something new. */
export function pickEnum<T>(value: string, allowed: readonly string[], fallback: T): T {
  return (allowed.includes(value) ? value : fallback) as T;
}
