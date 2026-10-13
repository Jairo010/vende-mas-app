import type { CameraCaptureResult } from '../types/media.types';

/** Device camera (store front photos). The returned file lives in a temporary cache. */
export interface ICameraPort {
  takePhoto(): Promise<CameraCaptureResult>;
}
