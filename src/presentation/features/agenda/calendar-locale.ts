import { LocaleConfig } from 'react-native-calendars';
import { es } from '@/shared/i18n/es';

interface CalendarLocaleRegistry {
  locales: Record<string, unknown>;
  defaultLocale: string;
}

const LOCALE = 'es';
let configured = false;

/** Spanish month and day names for react-native-calendars (texts live in es.ts). */
export function configureCalendarLocale(): void {
  if (configured) return;
  const registry = LocaleConfig as unknown as CalendarLocaleRegistry;
  registry.locales[LOCALE] = {
    monthNames: es.calendar.monthNames.split(','),
    monthNamesShort: es.calendar.monthNamesShort.split(','),
    dayNames: es.calendar.dayNames.split(','),
    dayNamesShort: es.calendar.dayNamesShort.split(','),
    today: es.common.today,
  };
  registry.defaultLocale = LOCALE;
  configured = true;
}
