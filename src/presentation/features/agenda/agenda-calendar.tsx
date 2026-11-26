import { useMemo, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CalendarDay } from '@/presentation/components/ui/calendar-day';
import {
  formatMonthTitle,
  MonthGrid,
  WEEKDAY_LABELS,
} from '@/presentation/components/ui/month-grid';
import { es } from '@/shared/i18n/es';
import { addDays, monthOf, shiftMonth, weekOf, type DateKey } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';
import type { CalendarMarks } from './agenda-marks';

/** Horizontal travel that counts as a swipe to the next / previous week or month. */
const SWIPE_DISTANCE = 40;
/** Travel after which the calendar takes the gesture from the day buttons. */
const SWIPE_START = 12;

export interface AgendaCalendarProps {
  selectedDate: DateKey;
  today: DateKey;
  onDateChange: (date: DateKey) => void;
  marks: CalendarMarks;
}

/**
 * Week strip of the home that opens into the whole month, with one dot per visit type. Built
 * with plain views (ADR 0019): what is shown always follows `selectedDate`, so moving to
 * another week or month selects a day in it and the agenda loads that period.
 */
export function AgendaCalendar({ selectedDate, today, onDateChange, marks }: AgendaCalendarProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const dots = useMemo(() => {
    const byDay: Record<DateKey, string[]> = {};
    for (const [day, mark] of Object.entries(marks)) {
      byDay[day] = mark.dots.map((dot) => dot.color);
    }
    return byDay;
  }, [marks]);

  const select = (date: DateKey) => {
    if (date === selectedDate) return;
    Haptics.selectionAsync().catch(() => {});
    onDateChange(date);
  };

  /** The same weekday of the next (+1) or previous (-1) week; the month while it is open. */
  const neighbour = (direction: 1 | -1): DateKey =>
    expanded ? shiftMonth(selectedDate, direction) : addDays(selectedDate, 7 * direction);

  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > SWIPE_START && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dx) < SWIPE_DISTANCE) return;
          Haptics.selectionAsync().catch(() => {});
          const direction = gesture.dx < 0 ? 1 : -1;
          onDateChange(
            expanded ? shiftMonth(selectedDate, direction) : addDays(selectedDate, 7 * direction),
          );
        },
      }),
    [expanded, selectedDate, onDateChange],
  );

  const Toggle = expanded ? ChevronUp : ChevronDown;

  return (
    <View testID="agenda-calendar" className="border-b border-border bg-card px-3 pb-1 pt-2">
      <View className="mb-2 flex-row items-center justify-between">
        <Pressable
          testID="agenda-calendar-previous"
          accessibilityRole="button"
          accessibilityLabel={expanded ? es.agenda.previousMonth : es.agenda.previousWeek}
          onPress={() => select(neighbour(-1))}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-xl active:bg-muted"
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </Pressable>

        <Pressable
          testID="agenda-calendar-title"
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityHint={expanded ? es.agenda.showWeek : es.agenda.showMonth}
          onPress={() => setExpanded((current) => !current)}
          className="flex-row items-center rounded-xl px-3 py-1.5 active:bg-muted"
        >
          <Text className="mr-1 text-base font-bold text-foreground">
            {formatMonthTitle(monthOf(selectedDate))}
          </Text>
          <Toggle size={18} color={colors.mutedForeground} />
        </Pressable>

        <Pressable
          testID="agenda-calendar-next"
          accessibilityRole="button"
          accessibilityLabel={expanded ? es.agenda.nextMonth : es.agenda.nextWeek}
          onPress={() => select(neighbour(1))}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-xl active:bg-muted"
        >
          <ChevronRight size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View {...swipe.panHandlers}>
        {expanded ? (
          <MonthGrid
            month={monthOf(selectedDate)}
            selectedDate={selectedDate}
            today={today}
            onSelectDay={select}
            dots={dots}
            dayTestIDPrefix="agenda-day"
          />
        ) : (
          <View className="h-14 flex-row">
            {weekOf(selectedDate).map((date, index) => (
              <View key={date} className="flex-1 p-0.5">
                <CalendarDay
                  testID={`agenda-day-${date}`}
                  date={date}
                  weekdayLabel={WEEKDAY_LABELS[index]}
                  selected={date === selectedDate}
                  isToday={date === today}
                  dots={dots[date]}
                  onPress={select}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      <Pressable
        testID="agenda-calendar-toggle"
        accessibilityRole="button"
        accessibilityLabel={expanded ? es.agenda.showWeek : es.agenda.showMonth}
        onPress={() => setExpanded((current) => !current)}
        hitSlop={8}
        className="items-center py-1.5"
      >
        <View className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </Pressable>
    </View>
  );
}
