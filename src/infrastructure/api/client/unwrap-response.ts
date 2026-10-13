/**
 * The API wraps every JSON response as `{ success, data, meta }`. Returns `data`, or the
 * body itself when it is not wrapped.
 */
export function unwrapApiData<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}
