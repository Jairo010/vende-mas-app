import { Directory, File, Paths } from 'expo-file-system';
import type { IPhotoFileStoragePort } from '@/core/ports/sync.ports';

const PHOTOS_DIRECTORY = 'pending-photos';

/**
 * Camera and gallery files live in a cache the OS may purge. Photos taken offline are
 * copied into the app's document directory until the sync uploads them.
 */
export const photoFileStorageAdapter: IPhotoFileStoragePort = {
  persist: async (sourceUri: string, photoId: string) => {
    const directory = new Directory(Paths.document, PHOTOS_DIRECTORY);
    directory.create({ idempotent: true, intermediates: true });

    const extension = sourceUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
    const target = new File(directory, `${photoId}.${extension}`);
    if (!target.exists) {
      await new File(sourceUri).copy(target);
    }
    return target.uri;
  },
  remove: async (localUri: string) => {
    const file = new File(localUri);
    if (file.exists) file.delete();
  },
};
