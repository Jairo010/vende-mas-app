import { useCallback, useState } from 'react';
import { CameraPermissionDeniedError } from '@/core/errors/device.errors';
import type { ICameraPort } from '@/core/ports/camera.port';
import type { IPhotoFileStoragePort } from '@/core/ports/sync.ports';
import { imagePickerCameraAdapter } from '@/infrastructure/device/image-picker-camera.adapter';
import { photoFileStorageAdapter } from '@/infrastructure/storage/photo-file-storage.adapter';
import { generateId } from '@/shared/utils/id';

/**
 * Takes a store photo and copies it out of the camera cache into app storage, so it
 * survives until the sync uploads it. Returns the durable URI, or null when cancelled.
 */
export function useStorePhotoCapture(
  camera: ICameraPort = imagePickerCameraAdapter,
  files: IPhotoFileStoragePort = photoFileStorageAdapter,
) {
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(async (): Promise<string | null> => {
    setIsCapturing(true);
    try {
      const result = await camera.takePhoto();
      if (result.status === 'PERMISSION_DENIED') throw new CameraPermissionDeniedError();
      if (result.status === 'CANCELLED') return null;
      return await files.persist(result.uri, generateId());
    } finally {
      setIsCapturing(false);
    }
  }, [camera, files]);

  /** Deletes a photo that was replaced or abandoned before being saved with a visit. */
  const discard = useCallback(
    (uri: string) => {
      files.remove(uri).catch(() => {});
    },
    [files],
  );

  return { capture, discard, isCapturing };
}
