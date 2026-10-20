import { useCallback } from 'react';
import type { VisitEntity } from '@/core/entities/visit.entity';
import type { ILocationPort } from '@/core/ports/location.port';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import type { LocationReading } from '@/core/types/geo.types';
import type { CompleteVisitInput } from '@/core/types/visit.types';
import { expoLocationAdapter } from '@/infrastructure/device/expo-location.adapter';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { useCurrentLocation } from '../device/use-current-location';
import { useCompleteVisit } from './use-complete-visit';

export interface CheckOutResult {
  visit: VisitEntity;
  reading: LocationReading;
}

/** Check-out = read the GPS, then complete the visit locally with the outcome. */
export function useCheckOutVisit(
  repository: IVisitRepositoryPort = sqliteVisitRepository,
  location: ILocationPort = expoLocationAdapter,
) {
  const { capture, isCapturing } = useCurrentLocation(location);
  const { completeVisit, isPending } = useCompleteVisit(repository);

  const checkOut = useCallback(
    async (id: string, input: Omit<CompleteVisitInput, 'location'>): Promise<CheckOutResult> => {
      const reading = await capture();
      const visit = await completeVisit({
        id,
        ...input,
        location: reading.ok ? reading.point : undefined,
      });
      return { visit, reading };
    },
    [capture, completeVisit],
  );

  return { checkOut, isLocating: isCapturing, isPending: isCapturing || isPending };
}
