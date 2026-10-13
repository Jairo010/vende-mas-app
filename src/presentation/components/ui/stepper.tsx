import { Pressable, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/theme';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  testID?: string;
}

/** Quantity selector (order lines). */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  testID = 'stepper',
}: StepperProps) {
  const colors = useThemeColors();
  const canDecrease = value - step >= min;
  const canIncrease = value + step <= max;

  const change = (next: number) => {
    Haptics.selectionAsync().catch(() => {});
    onChange(next);
  };

  return (
    <View className="flex-row items-center rounded-xl border border-border bg-card">
      <Pressable
        testID={`${testID}-decrease`}
        accessibilityRole="button"
        accessibilityLabel="-"
        disabled={!canDecrease}
        onPress={() => change(value - step)}
        className={`h-9 w-9 items-center justify-center ${canDecrease ? '' : 'opacity-40'}`}
      >
        <Minus size={16} color={colors.foreground} />
      </Pressable>
      <Text
        testID={`${testID}-value`}
        className="min-w-[32px] text-center text-base font-semibold text-foreground"
      >
        {value}
      </Text>
      <Pressable
        testID={`${testID}-increase`}
        accessibilityRole="button"
        accessibilityLabel="+"
        disabled={!canIncrease}
        onPress={() => change(value + step)}
        className={`h-9 w-9 items-center justify-center ${canIncrease ? '' : 'opacity-40'}`}
      >
        <Plus size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}
