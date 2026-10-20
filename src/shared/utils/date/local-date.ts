/**
 * Calendar math in the business time zone. The app must never derive "today" from UTC:
 * after 19:00 in Ecuador (UTC-5) the UTC date is already tomorrow.
 *
 * - A `DateKey` is a calendar day in the business zone: `'YYYY-MM-DD'`.
 * - Instants are `Date` objects or ISO strings; the database stores them in UTC.
 * - Payloads to the API carry the local offset: `2026-10-14T09:30:00-05:00`.
 */
export const APP_TIME_ZONE = 'America/Guayaquil';
export const APP_LOCALE = 'es-EC';

export type DateKey = string;

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(instant: Date): ZonedParts {
  const parts: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour === 24 ? 0 : parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

/** Offset of the business zone at `instant`, in minutes east of UTC (Ecuador: -300). */
export function zoneOffsetMinutes(instant: Date): number {
  const p = zonedParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60_000);
}

function pad(value: number, length = 2): string {
  return String(Math.abs(value)).padStart(length, '0');
}

function parseDateKey(key: DateKey): { year: number; month: number; day: number } {
  const match = DATE_KEY_PATTERN.exec(key);
  if (!match) throw new RangeError(`Invalid date key: ${key}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Calendar day of `instant` in the business zone. */
export function toDateKey(instant: Date | string): DateKey {
  const p = zonedParts(new Date(instant));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

export function addDays(key: DateKey, days: number): DateKey {
  const { year, month, day } = parseDateKey(key);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Instant of a local wall-clock time (`'HH:mm'`) on a local day. */
export function zonedInstant(key: DateKey, time = '00:00'): Date {
  const { year, month, day } = parseDateKey(key);
  const match = TIME_PATTERN.exec(time);
  if (!match) throw new RangeError(`Invalid time: ${time}`);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, Number(match[1]), Number(match[2]));
  // First guess with the offset at that moment, then correct once (handles DST zones too).
  const guess = new Date(wallClockAsUtc - zoneOffsetMinutes(new Date(wallClockAsUtc)) * 60_000);
  return new Date(wallClockAsUtc - zoneOffsetMinutes(guess) * 60_000);
}

/** First and last instant of a local day, for range queries over UTC timestamps. */
export function dayRange(key: DateKey): { from: string; to: string } {
  const from = zonedInstant(key);
  const to = new Date(zonedInstant(addDays(key, 1)).getTime() - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** ISO 8601 with the business zone offset, as the API expects: `2026-10-14T09:30:00-05:00`. */
export function toZonedIsoString(instant: Date | string = new Date()): string {
  const date = new Date(instant);
  const p = zonedParts(date);
  const offset = zoneOffsetMinutes(date);
  const sign = offset >= 0 ? '+' : '-';
  return (
    `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}` +
    `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
  );
}

/** Local wall-clock time of an instant: `'09:30'`. */
export function toLocalTime(instant: Date | string): string {
  const p = zonedParts(new Date(instant));
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Weekday of a local day (0 = Sunday). */
export function weekdayOf(key: DateKey): number {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Monday of the week that contains `key`. */
export function startOfWeek(key: DateKey): DateKey {
  const weekday = weekdayOf(key);
  return addDays(key, weekday === 0 ? -6 : 1 - weekday);
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  return toDateKey(a) === toDateKey(b);
}
