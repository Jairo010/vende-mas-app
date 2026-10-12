import { useState, useMemo, useCallback } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface TasksCalendarStripProps {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  tasksCountByDate?: Record<string, number>;
  className?: string;
}

const DAYS_SHORT_ES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const DAYS_INITIAL_ES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d);
}

/**
 * Get the Monday-start week containing a given date.
 */
function getWeekDays(anchorDate: Date, todayKey: string) {
  const anchor = new Date(anchorDate);
  const dayOfWeek = anchor.getDay(); // 0=Sun, 1=Mon ...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + distanceToMonday);

  const days: Array<{
    date: Date;
    key: string;
    dayOfWeek: string;
    dayNumber: number;
    isToday: boolean;
  }> = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = formatDateKey(d);
    days.push({
      date: d,
      key,
      dayOfWeek: DAYS_SHORT_ES[i]!,
      dayNumber: d.getDate(),
      isToday: key === todayKey,
    });
  }

  return days;
}

/**
 * Generate full month grid (Monday-start, 6 rows x 7 cols).
 */
function getMonthGrid(year: number, month: number, todayKey: string) {
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Shift so Monday = 0, Sunday = 6
  const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const days: Array<{
    key: string;
    dayNumber: number;
    isoString: string;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  // Leading empty slots
  for (let i = 0; i < offset; i++) {
    days.push({
      key: `empty-${i}`,
      dayNumber: 0,
      isoString: '',
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const iso = `${year}-${monthStr}-${dayStr}`;

    days.push({
      key: iso,
      dayNumber: d,
      isoString: iso,
      isCurrentMonth: true,
      isToday: iso === todayKey,
    });
  }

  return days;
}

export function TasksCalendarStrip({
  selectedDate,
  onSelectDate,
  tasksCountByDate = {},
  className = '',
}: TasksCalendarStripProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  const [isExpanded, setIsExpanded] = useState(false);

  // The month/year being viewed in expanded mode
  const [viewYear, setViewYear] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-').map(Number);
      if (parts[0] && !isNaN(parts[0])) return parts[0];
    }
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-').map(Number);
      if (parts[1] && !isNaN(parts[1])) return parts[1] - 1;
    }
    return today.getMonth();
  });

  // Week strip: derive from selectedDate or today
  const anchorDate = useMemo(() => {
    if (selectedDate) return parseDateKey(selectedDate);
    return today;
  }, [selectedDate, today]);

  const weekDays = useMemo(() => {
    return getWeekDays(anchorDate, todayKey);
  }, [anchorDate, todayKey]);

  const monthGrid = useMemo(() => {
    return getMonthGrid(viewYear, viewMonth, todayKey);
  }, [viewYear, viewMonth, todayKey]);

  // Current displayed month/year label
  const currentMonthLabel = useMemo(() => {
    if (isExpanded) {
      return `${MONTHS_ES[viewMonth]} ${viewYear}`;
    }
    const midDay = weekDays[3]?.date || today;
    return `${MONTHS_ES[midDay.getMonth()]} ${midDay.getFullYear()}`;
  }, [isExpanded, viewMonth, viewYear, weekDays, today]);

  // --- Handlers ---

  const toggleExpand = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        280,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );

    if (!isExpanded) {
      // Sync expanded view to the selected date's month
      const anchor = selectedDate ? parseDateKey(selectedDate) : today;
      setViewYear(anchor.getFullYear());
      setViewMonth(anchor.getMonth());
    }

    setIsExpanded((prev) => !prev);
  }, [isExpanded, selectedDate, today]);

  const handlePrevMonth = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        200,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  }, [viewMonth]);

  const handleNextMonth = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        200,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  }, [viewMonth]);

  const handleTodayPress = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore
    }
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsExpanded(false);
    onSelectDate(todayKey);
  }, [today, todayKey, onSelectDate]);

  const handleDateSelect = useCallback(
    async (key: string) => {
      try {
        await Haptics.selectionAsync();
      } catch {
        // Ignore
      }
      onSelectDate(key);
    },
    [onSelectDate],
  );

  const handleExpandedDateSelect = useCallback(
    async (iso: string) => {
      if (!iso) return;
      try {
        await Haptics.selectionAsync();
      } catch {
        // Ignore
      }
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          250,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity,
        ),
      );
      setIsExpanded(false);
      onSelectDate(iso);
    },
    [onSelectDate],
  );

  const handlePrevWeek = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    // Navigate to previous week by selecting the date 7 days before the current anchor
    const newAnchor = new Date(anchorDate);
    newAnchor.setDate(newAnchor.getDate() - 7);
    onSelectDate(formatDateKey(newAnchor));
  }, [anchorDate, onSelectDate]);

  const handleNextWeek = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    const newAnchor = new Date(anchorDate);
    newAnchor.setDate(newAnchor.getDate() + 7);
    onSelectDate(formatDateKey(newAnchor));
  }, [anchorDate, onSelectDate]);

  // --- Render Helpers ---

  const renderDayCell = (
    key: string,
    dayNumber: number,
    isToday: boolean,
    isSelected: boolean,
    hasTask: boolean,
    onPress: () => void,
    size: 'strip' | 'grid',
  ) => {
    const isStrip = size === 'strip';
    const cellSize = isStrip ? 44 : 38;

    return (
      <Pressable
        key={key}
        testID={`calendar-day-${key}`}
        onPress={onPress}
        style={{
          width: isStrip ? undefined : '14.28%',
          flex: isStrip ? 1 : undefined,
          alignItems: 'center',
          paddingVertical: isStrip ? 8 : 2,
          marginHorizontal: isStrip ? 2 : 0,
        }}
      >
        {/* Day of week label (only in strip mode) */}
        {isStrip && (
          <Text
            className={`text-[10px] font-semibold mb-0.5 ${
              isSelected
                ? 'text-primary font-bold'
                : isToday
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground'
            }`}
          >
            {DAYS_SHORT_ES[weekDays.findIndex((d) => d.key === key)] ?? ''}
          </Text>
        )}

        {/* Day number circle */}
        <View
          style={{
            width: cellSize,
            height: cellSize,
            borderRadius: isStrip ? 14 : cellSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelected
              ? activeColors.primary
              : isToday
                ? scheme === 'dark'
                  ? 'rgba(229, 26, 26, 0.15)'
                  : 'rgba(229, 26, 26, 0.10)'
                : 'transparent',
            borderWidth: isToday && !isSelected ? 1.5 : 0,
            borderColor: isToday && !isSelected ? activeColors.primary : 'transparent',
          }}
        >
          <Text
            className={`font-bold ${isStrip ? 'text-base' : 'text-sm'} ${
              isSelected ? 'text-primary-foreground' : isToday ? 'text-primary' : 'text-foreground'
            }`}
          >
            {dayNumber}
          </Text>
        </View>

        {/* Task indicator dot */}
        <View className="h-1.5 mt-0.5 items-center justify-center">
          {hasTask ? (
            <View
              className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`}
            />
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View
      className={`bg-card border-b border-border px-3 pt-3 pb-2 ${className}`}
      style={{ elevation: 2 }}
    >
      {/* Month Header Row */}
      <View className="flex-row items-center justify-between mb-2 px-1">
        {/* Month label — tap to expand/collapse */}
        <Pressable
          testID="calendar-toggle-expand"
          onPress={toggleExpand}
          className="flex-row items-center active:opacity-70"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <CalendarIcon size={16} color={activeColors.primary} />
          <Text className="text-sm font-bold text-foreground ml-1.5 mr-1">{currentMonthLabel}</Text>
          {isExpanded ? (
            <ChevronUp size={14} color={activeColors.mutedForeground} />
          ) : (
            <ChevronDown size={14} color={activeColors.mutedForeground} />
          )}
        </Pressable>

        {/* Right controls */}
        <View className="flex-row items-center">
          {/* "Hoy" shortcut button */}
          <Pressable
            testID="calendar-today-button"
            onPress={handleTodayPress}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            style={{
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginRight: 6,
              backgroundColor:
                selectedDate === todayKey
                  ? scheme === 'dark'
                    ? 'rgba(229, 26, 26, 0.2)'
                    : 'rgba(229, 26, 26, 0.12)'
                  : activeColors.muted,
              borderWidth: selectedDate === todayKey ? 1 : 0,
              borderColor: selectedDate === todayKey ? activeColors.primary : 'transparent',
            }}
          >
            <Text
              className={`text-[11px] font-bold ${
                selectedDate === todayKey ? 'text-primary' : 'text-foreground'
              }`}
            >
              Hoy
            </Text>
          </Pressable>

          {/* Prev/Next week controls (only in collapsed mode) */}
          {!isExpanded && (
            <>
              <Pressable
                testID="calendar-prev-week"
                onPress={handlePrevWeek}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                className="h-7 w-7 items-center justify-center rounded-lg bg-muted active:opacity-70"
              >
                <ChevronLeft size={16} color={activeColors.foreground} />
              </Pressable>

              <Pressable
                testID="calendar-next-week"
                onPress={handleNextWeek}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                className="h-7 w-7 items-center justify-center rounded-lg bg-muted active:opacity-70 ml-1"
              >
                <ChevronRight size={16} color={activeColors.foreground} />
              </Pressable>
            </>
          )}

          {/* Prev/Next month controls (only in expanded mode) */}
          {isExpanded && (
            <>
              <Pressable
                testID="calendar-prev-month"
                onPress={handlePrevMonth}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                className="h-7 w-7 items-center justify-center rounded-lg bg-muted active:opacity-70"
              >
                <ChevronLeft size={16} color={activeColors.foreground} />
              </Pressable>

              <Pressable
                testID="calendar-next-month"
                onPress={handleNextMonth}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                className="h-7 w-7 items-center justify-center rounded-lg bg-muted active:opacity-70 ml-1"
              >
                <ChevronRight size={16} color={activeColors.foreground} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* === EXPANDED: Full Month Grid === */}
      {isExpanded && (
        <View className="mb-2">
          {/* Weekday headers */}
          <View className="flex-row items-center mb-1.5 px-0.5">
            {DAYS_INITIAL_ES.map((d, idx) => (
              <View key={`header-${idx}`} style={{ width: '14.28%', alignItems: 'center' }}>
                <Text className="text-[11px] font-bold text-muted-foreground">{d}</Text>
              </View>
            ))}
          </View>

          {/* Days grid */}
          <View className="flex-row flex-wrap px-0.5">
            {monthGrid.map((item) => {
              if (!item.isCurrentMonth) {
                return <View key={item.key} style={{ width: '14.28%', height: 46 }} />;
              }

              const isSelected = selectedDate === item.isoString;
              const taskCount = tasksCountByDate[item.isoString] || 0;

              return renderDayCell(
                item.key,
                item.dayNumber,
                item.isToday,
                isSelected,
                taskCount > 0,
                () => handleExpandedDateSelect(item.isoString),
                'grid',
              );
            })}
          </View>
        </View>
      )}

      {/* === COLLAPSED: 7-Day Week Strip === */}
      <View className="flex-row items-center justify-between">
        {weekDays.map((item) => {
          const isSelected = selectedDate === item.key;
          const taskCount = tasksCountByDate[item.key] || 0;

          return (
            <Pressable
              key={item.key}
              testID={`calendar-day-${item.key}`}
              onPress={() => handleDateSelect(item.key)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                marginHorizontal: 2,
                borderRadius: 14,
                backgroundColor: isSelected
                  ? activeColors.primary
                  : item.isToday
                    ? scheme === 'dark'
                      ? 'rgba(229, 26, 26, 0.12)'
                      : 'rgba(229, 26, 26, 0.08)'
                    : scheme === 'dark'
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'rgba(0, 0, 0, 0.03)',
                borderWidth: item.isToday && !isSelected ? 1.5 : 1,
                borderColor: isSelected
                  ? activeColors.primary
                  : item.isToday
                    ? activeColors.primary
                    : activeColors.border,
                elevation: isSelected ? 2 : 0,
              }}
            >
              <Text
                className={`text-[10px] font-semibold mb-0.5 ${
                  isSelected
                    ? 'text-primary-foreground font-bold'
                    : item.isToday
                      ? 'text-primary font-bold'
                      : 'text-muted-foreground'
                }`}
              >
                {item.dayOfWeek}
              </Text>

              <Text
                className={`text-base font-bold ${
                  isSelected
                    ? 'text-primary-foreground'
                    : item.isToday
                      ? 'text-primary'
                      : 'text-foreground'
                }`}
              >
                {item.dayNumber}
              </Text>

              {/* Task Count Dot / Indicator */}
              <View className="h-1.5 w-1.5 mt-1 items-center justify-center">
                {taskCount > 0 ? (
                  <View
                    className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`}
                  />
                ) : item.isToday ? (
                  <View
                    className={`h-1 w-1 rounded-full ${
                      isSelected ? 'bg-white/70' : 'bg-primary/50'
                    }`}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
