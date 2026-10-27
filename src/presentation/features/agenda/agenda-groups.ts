import type { VisitEntity } from '@/core/entities/visit.entity';
import { VISIT_TYPES, type VisitStatus, type VisitType } from '@/core/types/visit.types';

export interface AgendaGroup {
  type: VisitType;
  visits: VisitEntity[];
  /** Completed or cancelled visits of the group. */
  done: number;
}

/** What still needs the seller first, then what is already closed. */
const STATUS_ORDER: Readonly<Record<VisitStatus, number>> = {
  IN_PROGRESS: 0,
  SCHEDULED: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

/**
 * Inside a status: visits with an agreed time first (by time), then the ones planned for the
 * day only (by customer). Closed visits follow the order in which they really started.
 */
function compareVisits(a: VisitEntity, b: VisitEntity): number {
  const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (byStatus !== 0) return byStatus;

  if (a.start && b.start) return a.start.at.localeCompare(b.start.at);
  if (a.hasScheduledTime !== b.hasScheduledTime) return a.hasScheduledTime ? -1 : 1;
  if (a.hasScheduledTime) {
    const byTime = a.scheduledAt.localeCompare(b.scheduledAt);
    if (byTime !== 0) return byTime;
  }
  return (a.customer?.tradeName ?? '').localeCompare(b.customer?.tradeName ?? '');
}

/** The day's visits grouped by type (opportunity, order, collection); empty types are left out. */
export function groupVisitsByType(visits: readonly VisitEntity[]): AgendaGroup[] {
  return VISIT_TYPES.map((type) => {
    const ofType = visits.filter((visit) => visit.type === type).sort(compareVisits);
    return { type, visits: ofType, done: ofType.filter((visit) => visit.isClosed()).length };
  }).filter((group) => group.visits.length > 0);
}
