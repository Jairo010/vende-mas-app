import { useCallback, useState } from 'react';
import type { ILocationPort } from '@/core/ports/location.port';
import type { LocationReading } from '@/core/types/geo.types';
import { expoLocationAdapter } from '@/infrastructure/device/expo-location.adapter';

/** Reads the GPS on demand (check-in / check-out). Never throws. */
export function useCurrentLocation(location: ILocationPort = expoLocationAdapter) {
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(async (): Promise<LocationReading> => {
    setIsCapturing(true);
    try {
      return await location.getCurrentPosition();
    } finally {
      setIsCapturing(false);
    }
  }, [location]);

  return { capture, isCapturing };
}
