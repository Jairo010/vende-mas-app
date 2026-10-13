/** Result of opening the camera. */
export type CameraCaptureResult =
  { status: 'CAPTURED'; uri: string } | { status: 'CANCELLED' } | { status: 'PERMISSION_DENIED' };
