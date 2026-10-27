import { businessConfig } from '@/shared/config/business-config';
import { type DateKey, zonedInstant } from './local-date';

type FormatKind = 'date' | 'dateTime' | 'time' | 'dayLabel';

const OPTIONS: Readonly<Record<FormatKind, Intl.DateTimeFormatOptions>> = {
  date: { day: 'numeric', month: 'short', year: 'numeric' },
  dateTime: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  },
  time: { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  dayLabel: { weekday: 'long', day: 'numeric', month: 'long' },
};

/** Formatters in the company locale and zone, built once per combination. */
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(kind: FormatKind): Intl.DateTimeFormat {
  const { locale, timeZone } = businessConfig();
  const key = `${kind}|${locale}|${timeZone}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, { ...OPTIONS[kind], timeZone });
    formatters.set(key, cached);
  }
  return cached;
}

function isValid(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

/** `14 oct 2026` */
export function formatDate(instant: Date | string | number): string {
  const date = new Date(instant);
  return isValid(date) ? formatter('date').format(date) : '';
}

/** `14 oct 2026, 09:30` */
export function formatDateTime(instant: Date | string | number): string {
  const date = new Date(instant);
  return isValid(date) ? formatter('dateTime').format(date) : '';
}

/** `09:30` */
export function formatTime(instant: Date | string | number): string {
  const date = new Date(instant);
  return isValid(date) ? formatter('time').format(date) : '';
}

/** `martes, 14 de octubre` (for a local calendar day). */
export function formatDayLabel(key: DateKey): string {
  return formatter('dayLabel').format(zonedInstant(key, '12:00'));
}
