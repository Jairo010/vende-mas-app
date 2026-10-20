import { useEffect, useState } from 'react';
import type { ISecureStoragePort } from '@/core/ports/secure-storage.port';
import { secureStorageAdapter } from '@/infrastructure/storage/secure-storage.adapter';
import { API_BASE_URL } from '@/shared/constants/api.constants';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';

export interface PhotoSource {
  uri: string;
  headers?: Record<string, string>;
}

/**
 * Image source for a photo that may be local (`file://`, taken offline) or stored in the
 * API (`/api/v1/files/photos/...`, served only with the Bearer token).
 */
export function usePhotoSource(
  photoUrl: string | null | undefined,
  secureStorage: ISecureStoragePort = secureStorageAdapter,
): PhotoSource | null {
  const isApiPath = Boolean(photoUrl?.startsWith('/'));
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiPath) return;
    let active = true;
    secureStorage
      .getItem(STORAGE_KEYS.ACCESS_TOKEN)
      .then((value) => {
        if (active) setToken(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isApiPath, secureStorage]);

  if (!photoUrl) return null;
  if (!isApiPath) return { uri: photoUrl };
  if (!token) return null;
  return { uri: `${API_BASE_URL}${photoUrl}`, headers: { Authorization: `Bearer ${token}` } };
}
