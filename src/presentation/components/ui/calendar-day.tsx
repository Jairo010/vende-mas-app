import { Pressable, Text, View } from 'react-native';
import { formatDayLabel, type DateKey } from '@/shared/utils/date';
import { useThemeColorWithAlpha, useThemeColors } from '@/theme';

/** Most dots that fit under a day number. */
const MAX_DOTS = 3;

export interface CalendarDayProps {
  date: DateKey;
  selected: boolean;
  isToday: boolean;
  disabled?: boolean;
  /** Colors of the marks under the number (e.g. one per visit type). */
  dots?: readonly string[];
  /** Short weekday shown over the number (week strip). */
  weekdayLabel?: string;
  onPress: (date: DateKey) => void;
  testID?: string;
}

/**
 * One day of a calendar (month grid or week strip): number, today / selected states and marks.
 * Plain views only, so it always paints.
 */
export function CalendarDay({
  date,
  selected,
  isToday,
  disabled = false,
  dots = [],
  weekdayLabel,
  onPress,
  testID,
}: CalendarDayProps) {
  const colors = useThemeColors();
  const todayTint = useThemeColorWithAlpha('primary', 0.1);
  const textClass = selected
    ? 'text-primary-foreground'
    : isToday
      ? 'text-primary'
      : 'text-foreground';
  // Without marks, today keeps its own dot so it is found at a glance.
  const marks = dots.length > 0 ? dots.slice(0, MAX_DOTS) : isToday ? [colors.primary] : [];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={formatDayLabel(date)}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => onPress(date)}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: selected ? colors.primary : isToday ? todayTint : 'transparent',
        borderWidth: selected || isToday ? 1 : 0,
        borderColor: colors.primary,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {weekdayLabel ? (
        <Text
          className={`text-[11px] font-semibold ${
            selected ? 'text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          {weekdayLabel}
        </Text>
      ) : null}
      <Text className={`text-sm font-bold ${textClass}`}>{Number(date.slice(8, 10))}</Text>
      <View className="mt-0.5 h-1 flex-row items-center justify-center gap-0.5">
        {marks.map((color, index) => (
          <View
            key={`${color}-${index}`}
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: selected ? colors.primaryForeground : color }}
          />
        ))}
      </View>
    </Pressable>
  );
}
