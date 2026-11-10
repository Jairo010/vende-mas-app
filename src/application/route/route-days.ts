import type { RouteDay } from '@/core/types/route.types';
import { addDays, weekdayOf, type DateKey } from '@/shared/utils/date';

/** How far ahead to look: enough for a route of one day a week to give `count` dates. */
const MAX_DAYS_AHEAD = 70;

/** ISO weekday (1 = Monday … 7 = Sunday), as the API counts them. */
const isoWeekdayOf = (date: DateKey): number => weekdayOf(date) || 7;

/**
 * Weekdays the seller's route goes through the customer's zone (API ADR 0037). Empty when the
 * customer has no zone or the route does not go there: then there is no route day to respect.
 */
export function routeWeekdaysOf(
  zoneId: string | null | undefined,
  routeDays: readonly RouteDay[],
): readonly number[] {
  if (!zoneId) return [];
  return [...new Set(routeDays.filter((day) => day.zoneId === zoneId).map((day) => day.weekday))];
}

/** A day a visit can go to: any day when the customer has no route days. */
export function isRouteDay(date: DateKey, weekdays: readonly number[]): boolean {
  return weekdays.length === 0 || weekdays.includes(isoWeekdayOf(date));
}

/** `date` itself when it is a route day, otherwise the next one. */
export function nextRouteDayFrom(date: DateKey, weekdays: readonly number[]): DateKey {
  for (let offset = 0; offset < MAX_DAYS_AHEAD; offset++) {
    const candidate = addDays(date, offset);
    if (isRouteDay(candidate, weekdays)) return candidate;
  }
  return date;
}

/** Same day of the next month, or its last day when that month is shorter (31 → 30). */
function addOneMonth(date: DateKey): DateKey {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const next = new Date(Date.UTC(year, month, Math.min(day, lastDay)));
  return next.toISOString().slice(0, 10);
}

export const QUICK_VISIT_DATES = ['WEEK', 'TWO_WEEKS', 'MONTH'] as const;
export type QuickVisitDate = (typeof QUICK_VISIT_DATES)[number];

/**
 * When to come back in one tap (app ADR 0015): in one week, two weeks or a month, each moved
 * forward to the next route day of the customer.
 */
export function quickVisitDates(
  today: DateKey,
  weekdays: readonly number[],
): Readonly<Record<QuickVisitDate, DateKey>> {
  return {
    WEEK: nextRouteDayFrom(addDays(today, 7), weekdays),
    TWO_WEEKS: nextRouteDayFrom(addDays(today, 14), weekdays),
    MONTH: nextRouteDayFrom(addOneMonth(today), weekdays),
  };
}

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
  const weekdays = routeWeekdaysOf(zoneId, routeDays);
  if (weekdays.length === 0) return [];

  const dates: DateKey[] = [];
  for (let offset = 0; offset < MAX_DAYS_AHEAD && dates.length < count; offset++) {
    const date = addDays(today, offset);
    if (isRouteDay(date, weekdays) && date !== exclude) dates.push(date);
  }
  return dates;
}
