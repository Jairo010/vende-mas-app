import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface FloatingActionButtonProps {
  /** What the button does, written on it ("Nueva visita"): an icon alone has to be guessed. */
  label: string;
  icon: ReactNode;
  onPress: () => void;
  testID?: string;
}

/** Main action of a tab, over its list, in the same place on every tab. */
export function FloatingActionButton({ label, icon, onPress, testID }: FloatingActionButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      className="absolute bottom-6 right-5 h-14 flex-row items-center rounded-2xl bg-primary pl-4 pr-5 shadow-lg active:opacity-90"
    >
      {icon}
      <Text className="ml-2 text-base font-semibold text-primary-foreground">{label}</Text>
    </Pressable>
  );
}
