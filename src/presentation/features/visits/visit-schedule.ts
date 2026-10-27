import type { VisitEntity } from '@/core/entities/visit.entity';
import { formatDate, formatDateTime, formatTime } from '@/shared/utils/date';

type ScheduledVisit = Pick<VisitEntity, 'scheduledAt' | 'hasScheduledTime'>;

/** `14 oct 2026, 09:30`, or only `14 oct 2026` when the visit has no agreed time. */
export function formatVisitSchedule(visit: ScheduledVisit): string {
  return visit.hasScheduledTime ? formatDateTime(visit.scheduledAt) : formatDate(visit.scheduledAt);
}

/** `09:30`, or `null` when the visit is planned for the day only. */
export function formatVisitTime(visit: ScheduledVisit): string | null {
  return visit.hasScheduledTime ? formatTime(visit.scheduledAt) : null;
}
