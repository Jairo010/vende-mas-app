import { useCallback } from 'react';
import type { VisitEntity } from '@/core/entities/visit.entity';
import type { ILocationPort } from '@/core/ports/location.port';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { LocationReading } from '@/core/types/geo.types';
import { expoLocationAdapter } from '@/infrastructure/device/expo-location.adapter';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { useCurrentLocation } from '../device/use-current-location';
import { useStartVisit } from './use-start-visit';

export interface CheckInResult {
  visit: VisitEntity;
  /** The GPS reading (a failed one does not block the check-in). */
  reading: LocationReading;
}

/** Check-in = read the GPS, then start the visit locally with whatever position we got. */
export function useCheckInVisit(
  repository: IVisitRepositoryPort = sqliteVisitRepository,
  location: ILocationPort = expoLocationAdapter,
) {
  const { capture, isCapturing } = useCurrentLocation(location);
  const { startVisit, isPending } = useStartVisit(repository);

  const checkIn = useCallback(
    async (id: string): Promise<CheckInResult> => {
      const reading = await capture();
      const visit = await startVisit({ id, location: reading.ok ? reading.point : undefined });
      return { visit, reading };
    },
    [capture, startVisit],
  );

  return { checkIn, isLocating: isCapturing, isPending: isCapturing || isPending };
}
