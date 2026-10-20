import { useMemo, type ReactNode } from 'react';
import { CalendarProvider, ExpandableCalendar } from 'react-native-calendars';
import type { DateKey } from '@/shared/utils/date';
import { FONT_FAMILY, useAppColorScheme, useThemeColors } from '@/theme';
import type { CalendarMarks } from './agenda-marks';
import { configureCalendarLocale } from './calendar-locale';

configureCalendarLocale();

const MONDAY = 1;

export interface AgendaCalendarProps {
  selectedDate: DateKey;
  onDateChange: (date: DateKey) => void;
  marks: CalendarMarks;
  /** Content under the calendar (the day's visits), inside the calendar context. */
  children: ReactNode;
}

/**
 * Week strip that expands into a month (react-native-calendars), with one dot per visit
 * type. Remounted on theme change: the library caches its styles on mount.
 */
export function AgendaCalendar({
  selectedDate,
  onDateChange,
  marks,
  children,
}: AgendaCalendarProps) {
  const colors = useThemeColors();
  const scheme = useAppColorScheme();

  const theme = useMemo(
    () => ({
      calendarBackground: colors.card,
      backgroundColor: colors.card,
      textSectionTitleColor: colors.mutedForeground,
      dayTextColor: colors.foreground,
      textDisabledColor: colors.mutedForeground,
      textInactiveColor: colors.mutedForeground,
      monthTextColor: colors.foreground,
      todayTextColor: colors.primary,
      selectedDayBackgroundColor: colors.primary,
      selectedDayTextColor: colors.primaryForeground,
      arrowColor: colors.primary,
      disabledArrowColor: colors.mutedForeground,
      dotColor: colors.primary,
      selectedDotColor: colors.primaryForeground,
      textDayFontFamily: FONT_FAMILY,
      textMonthFontFamily: FONT_FAMILY,
      textDayHeaderFontFamily: FONT_FAMILY,
      textMonthFontWeight: '700' as const,
      textDayHeaderFontWeight: '600' as const,
    }),
    [colors],
  );

  const markedDates = useMemo(() => {
    const selected = marks[selectedDate];
    return {
      ...marks,
      [selectedDate]: { ...(selected ?? { dots: [] }), selected: true },
    };
  }, [marks, selectedDate]);

  return (
    <CalendarProvider
      key={scheme}
      date={selectedDate}
      onDateChanged={(date) => onDateChange(date)}
      theme={theme}
      style={{ backgroundColor: colors.background }}
    >
      <ExpandableCalendar
        testID="agenda-calendar"
        firstDay={MONDAY}
        markingType="multi-dot"
        markedDates={markedDates}
        theme={theme}
        allowShadow={false}
        hideArrows={false}
        calendarStyle={{ backgroundColor: colors.card }}
        headerStyle={{ backgroundColor: colors.card }}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      />
      {children}
    </CalendarProvider>
  );
}
