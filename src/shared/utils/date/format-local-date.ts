import { APP_LOCALE, APP_TIME_ZONE, type DateKey, zonedInstant } from './local-date';

const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const timeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const dayLabelFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function isValid(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

/** `14 oct 2026` */
export function formatDate(instant: Date | string | number): string {
  const date = new Date(instant);
  return isValid(date) ? dateFormatter.format(date) : '';
}

/** `14 oct 2026, 09:30` */
export function formatDateTime(instant: Date | string | number): string {
  const date = new Date(instant);
  return isValid(date) ? dateTimeFormatter.format(date) : '';
}

/** `09:30` */
export function formatTime(instant: Date | string | number): string {
  const date = new Date(instant);
  return isValid(date) ? timeFormatter.format(date) : '';
}

/** `martes, 14 de octubre` (for a local calendar day). */
export function formatDayLabel(key: DateKey): string {
  return dayLabelFormatter.format(zonedInstant(key, '12:00'));
}
