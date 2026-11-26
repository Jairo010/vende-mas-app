/**
 * Calendar layout math over `DateKey`s (no time zone involved: a day key is already a local
 * calendar day). Weeks start on Monday, as the whole app shows them.
 */
import { addDays, startOfWeek, weekdayOf, type DateKey } from './local-date';

/** A calendar month: `'YYYY-MM'`. */
export type MonthKey = string;

const DAYS_IN_WEEK = 7;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseMonth(month: MonthKey): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new RangeError(`Invalid month key: ${month}`);
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function monthOf(key: DateKey): MonthKey {
  return key.slice(0, 7);
}

export function addMonths(month: MonthKey, months: number): MonthKey {
  const parsed = parseMonth(month);
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + months, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function daysInMonth(month: MonthKey): number {
  const parsed = parseMonth(month);
  return new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
}

/** The same day in another month, or that month's last day when it is shorter (31 → 30). */
export function shiftMonth(key: DateKey, months: number): DateKey {
  const month = addMonths(monthOf(key), months);
  const day = Math.min(Number(key.slice(8, 10)), daysInMonth(month));
  return `${month}-${pad(day)}`;
}

/** The seven days (Monday to Sunday) of the week that contains `key`. */
export function weekOf(key: DateKey): DateKey[] {
  const monday = startOfWeek(key);
  return Array.from({ length: DAYS_IN_WEEK }, (_, index) => addDays(monday, index));
}

/**
 * Cells of a month grid, row by row from Monday: `null` for the slots before the 1st and after
 * the last day, so every row has seven cells.
 */
export function monthCells(month: MonthKey): (DateKey | null)[] {
  const first = `${month}-01`;
  const weekday = weekdayOf(first);
  const leading = weekday === 0 ? DAYS_IN_WEEK - 1 : weekday - 1;
  const cells: (DateKey | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth(month); day += 1) cells.push(`${month}-${pad(day)}`);
  while (cells.length % DAYS_IN_WEEK !== 0) cells.push(null);
  return cells;
}
