import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/theme';

export interface ListItemProps {
  title: string;
  subtitle?: string | null;
  /** Small line under the subtitle (e.g. address, time). */
  caption?: string | null;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  testID?: string;
  className?: string;
}

export function ListItem({
  title,
  subtitle,
  caption,
  leading,
  trailing,
  onPress,
  showChevron = Boolean(onPress),
  testID,
  className = '',
}: ListItemProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={`flex-row items-center bg-card px-4 py-3.5 active:bg-muted ${className}`}
    >
      {leading ? <View className="mr-3">{leading}</View> : null}
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-sm text-muted-foreground" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {caption ? (
          <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
      {trailing ? <View className="ml-3 items-end">{trailing}</View> : null}
      {showChevron ? (
        <ChevronRight size={18} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
      ) : null}
    </Pressable>
  );
}
