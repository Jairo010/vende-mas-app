import type { VisitEntity } from '@/core/entities/visit.entity';
import { VISIT_TYPES, type VisitType } from '@/core/types/visit.types';
import { addDays, startOfWeek, toDateKey, type DateKey } from '@/shared/utils/date';
import type { ResolvedThemeColors } from '@/theme';
import { VISIT_TYPE_VISUALS } from '../visits/visit-visuals';

export interface CalendarDot {
  key: VisitType;
  color: string;
}

export type CalendarMarks = Record<DateKey, { dots: CalendarDot[] }>;

/**
 * One dot per visit type present on each day (cancelled visits are left out), for the
 * whole visible range.
 */
export function buildCalendarMarks(
  visits: readonly VisitEntity[],
  colors: ResolvedThemeColors,
): CalendarMarks {
  const typesByDay = new Map<DateKey, Set<VisitType>>();
  for (const visit of visits) {
    if (visit.status === 'CANCELLED') continue;
    const day = toDateKey(visit.scheduledAt);
    const types = typesByDay.get(day) ?? new Set<VisitType>();
    types.add(visit.type);
    typesByDay.set(day, types);
  }

  const marks: CalendarMarks = {};
  for (const [day, types] of typesByDay) {
    marks[day] = {
      dots: VISIT_TYPES.filter((type) => types.has(type)).map((type) => ({
        key: type,
        color: colors[VISIT_TYPE_VISUALS[type].token],
      })),
    };
  }
  return marks;
}

/**
 * Days loaded for the calendar: the full weeks that cover the month of `day`, so the dots of
 * the leading/trailing days of other months are right too.
 */
export function visibleMonthRange(day: DateKey): { from: DateKey; to: DateKey } {
  const firstOfMonth = `${day.slice(0, 7)}-01`;
  const [year, month] = firstOfMonth.split('-').map(Number);
  const nextMonth =
    month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastOfMonth = addDays(nextMonth, -1);
  return { from: startOfWeek(firstOfMonth), to: addDays(startOfWeek(lastOfMonth), 6) };
}

export interface DaySummary {
  scheduled: number;
  inProgress: number;
  completed: number;
}

export function summarizeDay(visits: readonly VisitEntity[]): DaySummary {
  return visits.reduce<DaySummary>(
    (summary, visit) => {
      if (visit.status === 'SCHEDULED') summary.scheduled += 1;
      else if (visit.status === 'IN_PROGRESS') summary.inProgress += 1;
      else if (visit.status === 'COMPLETED') summary.completed += 1;
      return summary;
    },
    { scheduled: 0, inProgress: 0, completed: 0 },
  );
}
