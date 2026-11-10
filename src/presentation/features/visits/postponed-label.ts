import { isPostponedOn } from '@/application/route/route-plan';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { es } from '@/shared/i18n/es';
import { todayKey, toLocalTime } from '@/shared/utils/date';

/** "Volver más tarde · 15:00" while the visit is left for later today; null otherwise. */
export function postponedLabel(visit: VisitEntity, today: string = todayKey()): string | null {
  if (!isPostponedOn(visit, today)) return null;
  return visit.postponedUntil
    ? es.visits.postpone.badgeAt(toLocalTime(visit.postponedUntil))
    : es.visits.postpone.badge;
}
