import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows a back button (stack screens). */
  onBack?: () => void;
  rightElement?: ReactNode;
  /** Adds the top safe-area inset (screens without a native header). */
  withSafeArea?: boolean;
  className?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightElement,
  withSafeArea = true,
  className = '',
}: ScreenHeaderProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`border-b border-border bg-card ${className}`}
      style={{ paddingTop: withSafeArea ? insets.top : 0 }}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="mr-2 flex-1 flex-row items-center">
          {onBack ? (
            <Pressable
              testID="screen-header-back-button"
              accessibilityRole="button"
              accessibilityLabel={es.common.back}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onBack();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="mr-2 h-10 w-10 items-center justify-center rounded-xl active:bg-muted"
            >
              <ChevronLeft size={22} color={colors.foreground} />
            </Pressable>
          ) : null}

          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {rightElement ? <View className="flex-row items-center">{rightElement}</View> : null}
      </View>
    </View>
  );
}
