import { Pressable, Text, View } from 'react-native';
import { Clock, X } from 'lucide-react-native';
import { TimePickerField } from '@/presentation/components/ui/date-time-picker-field';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

export interface OptionalTimeFieldProps {
  /** `HH:mm`, or `null` when the visit has no agreed time. */
  value: string | null;
  onChange: (time: string | null) => void;
  /** Time offered when the user adds one. */
  suggestedTime: string;
  error?: string | null;
  testID?: string;
}

/** The time of a visit is optional: without it, the visit is planned for the whole day. */
export function OptionalTimeField({
  value,
  onChange,
  suggestedTime,
  error,
  testID = 'optional-time',
}: OptionalTimeFieldProps) {
  const colors = useThemeColors();

  if (value === null) {
    return (
      <View>
        <Text className="mb-1.5 text-sm font-medium text-foreground">
          {es.newVisit.timeOptional}
        </Text>
        <Pressable
          testID={`${testID}-add`}
          accessibilityRole="button"
          onPress={() => onChange(suggestedTime)}
          className="h-12 flex-row items-center rounded-xl border border-dashed border-input px-3.5 active:bg-muted"
        >
          <Clock size={18} color={colors.primary} />
          <Text className="ml-2.5 text-base font-medium text-primary">{es.newVisit.addTime}</Text>
        </Pressable>
        <Text className="mt-1 pl-0.5 text-xs text-muted-foreground">{es.newVisit.noTimeHint}</Text>
        {error ? (
          <Text className="mt-1 pl-0.5 text-xs font-medium text-destructive">{error}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-foreground">{es.newVisit.timeOptional}</Text>
        <Pressable
          testID={`${testID}-remove`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChange(null)}
          className="flex-row items-center"
        >
          <X size={14} color={colors.mutedForeground} />
          <Text className="ml-1 text-xs font-semibold text-muted-foreground">
            {es.newVisit.removeTime}
          </Text>
        </Pressable>
      </View>
      <TimePickerField
        testID={testID}
        value={value}
        onChange={onChange}
        error={error ?? undefined}
      />
    </View>
  );
}
