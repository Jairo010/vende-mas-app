import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  testID?: string;
  className?: string;
}

/** Filter / category chip. */
export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  testID,
  className = '',
}: ChipProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      className={`flex-row items-center rounded-full border px-3.5 py-1.5 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-card active:bg-muted'
      } ${className}`}
    >
      {icon}
      <Text
        className={`text-sm font-medium ${icon ? 'ml-1.5' : ''} ${
          selected ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
