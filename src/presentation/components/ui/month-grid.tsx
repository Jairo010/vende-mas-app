import { Text, View } from 'react-native';
import { es } from '@/shared/i18n/es';
import { monthCells, type DateKey, type MonthKey } from '@/shared/utils/date';
import { CalendarDay } from './calendar-day';

const MONTH_NAMES = es.calendar.monthNames.split(',');
const SUNDAY_FIRST = es.calendar.dayNamesShort.split(',');
/** Short weekday names from Monday, the order every calendar of the app uses. */
export const WEEKDAY_LABELS: readonly string[] = [...SUNDAY_FIRST.slice(1), SUNDAY_FIRST[0]];

/** `Septiembre 2026` */
export function formatMonthTitle(month: MonthKey): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return `${MONTH_NAMES[monthNumber - 1]} ${year}`;
}

/** Monday to Sunday header of a calendar. */
export function WeekdayHeader() {
  return (
    <View className="mb-1 flex-row">
      {WEEKDAY_LABELS.map((label) => (
        <View key={label} className="flex-1 items-center">
          <Text className="text-xs font-bold text-muted-foreground">{label}</Text>
        </View>
      ))}
    </View>
  );
}

export interface MonthGridProps {
  month: MonthKey;
  selectedDate: DateKey | null;
  today: DateKey;
  onSelectDay: (date: DateKey) => void;
  /** Days shown but not selectable (before a minimum date, off the route). */
  isDayDisabled?: (date: DateKey) => boolean;
  /** Colors of the marks of each day. */
  dots?: Readonly<Record<DateKey, readonly string[]>>;
  /** Prefix of each day's testID (`<prefix>-YYYY-MM-DD`). */
  dayTestIDPrefix?: string;
}

/** A month as rows of weeks (Monday first). Shared by the date picker and the agenda. */
export function MonthGrid({
  month,
  selectedDate,
  today,
  onSelectDay,
  isDayDisabled,
  dots,
  dayTestIDPrefix = 'date-day',
}: MonthGridProps) {
  return (
    <View>
      <WeekdayHeader />
      <View className="flex-row flex-wrap">
        {monthCells(month).map((date, index) => (
          <View key={date ?? `empty-${index}`} className="h-11 w-[14.28%] p-0.5">
            {date ? (
              <CalendarDay
                testID={`${dayTestIDPrefix}-${date}`}
                date={date}
                selected={date === selectedDate}
                isToday={date === today}
                disabled={isDayDisabled?.(date) ?? false}
                dots={dots?.[date]}
                onPress={onSelectDay}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
