import type { RouteDay } from '@/core/types/route.types';
import { addDays, weekdayOf, type DateKey } from '@/shared/utils/date';

/** How far ahead to look: enough for a route of one day a week to give `count` dates. */
const MAX_DAYS_AHEAD = 70;

/**
 * Next dates the seller's route goes through the customer's zone, where a visit can be moved
 * (API ADR 0037). Empty when the customer has no zone or the route does not go there: then there
 * is no route day to respect. `exclude`: the date the visit already has.
 */
export function nextRouteDates(
  zoneId: string | null | undefined,
  routeDays: readonly RouteDay[],
  today: DateKey,
  exclude: DateKey,
  count = 4,
): DateKey[] {
  if (!zoneId) return [];
  const weekdays = new Set(
    routeDays.filter((day) => day.zoneId === zoneId).map((day) => day.weekday),
  );
  if (weekdays.size === 0) return [];

  const dates: DateKey[] = [];
  for (let offset = 0; offset < MAX_DAYS_AHEAD && dates.length < count; offset++) {
    const date = addDays(today, offset);
    // The API counts weekdays from Monday (1) to Sunday (7).
    if (weekdays.has(weekdayOf(date) || 7) && date !== exclude) dates.push(date);
  }
  return dates;
}
