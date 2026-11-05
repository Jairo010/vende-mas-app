import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CircleCheck, Circle } from 'lucide-react-native';
import { useThemeColors } from '@/theme';

export interface ChoiceGroupProps<T extends string> {
  title: string;
  options: readonly T[];
  labelOf: (option: T) => string;
  value: T | null;
  onChange: (option: T) => void;
  /** Each option gets the testID `${testIdPrefix}-${option}`. */
  testIdPrefix: string;
  error?: string;
}

/** One choice among a few, as a grid of radio buttons. */
export function ChoiceGroup<T extends string>({
  title,
  options,
  labelOf,
  value,
  onChange,
  testIdPrefix,
  error,
}: ChoiceGroupProps<T>) {
  const colors = useThemeColors();

  return (
    <View>
      <Text className="mb-3 text-base font-semibold text-foreground">{title}</Text>
      <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
        {options.map((option) => {
          const selected = option === value;
          const Icon = selected ? CircleCheck : Circle;
          return (
            <Pressable
              key={option}
              testID={`${testIdPrefix}-${option}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(option);
              }}
              className={`min-w-[47%] flex-1 flex-row items-center rounded-xl border px-3 py-3 ${
                selected ? 'border-primary bg-primary/10' : 'border-border bg-card active:bg-muted'
              }`}
            >
              <Icon size={18} color={selected ? colors.primary : colors.mutedForeground} />
              <Text
                className={`ml-2 flex-1 text-sm ${
                  selected ? 'font-semibold text-foreground' : 'text-foreground'
                }`}
              >
                {labelOf(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="mt-2 text-xs font-medium text-destructive">{error}</Text> : null}
    </View>
  );
}
