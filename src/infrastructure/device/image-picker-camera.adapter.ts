import * as ImagePicker from 'expo-image-picker';
import type { ICameraPort } from '@/core/ports/camera.port';
import type { CameraCaptureResult } from '@/core/types/media.types';

/** Store photos are evidence, not art: compressed to keep uploads light on mobile data. */
const PHOTO_QUALITY = 0.6;

export const imagePickerCameraAdapter: ICameraPort = {
  takePhoto: async (): Promise<CameraCaptureResult> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'PERMISSION_DENIED' };

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: PHOTO_QUALITY,
      allowsEditing: false,
      exif: false,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    return asset ? { status: 'CAPTURED', uri: asset.uri } : { status: 'CANCELLED' };
  },
};
