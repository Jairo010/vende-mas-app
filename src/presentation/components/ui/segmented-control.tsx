import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      className={`flex-row rounded-xl border border-border bg-muted p-1 ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            testID={`segment-${option.value}`}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(option.value);
            }}
            className={`flex-1 items-center justify-center rounded-lg py-2 ${
              selected ? 'bg-card shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-sm ${
                selected ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
