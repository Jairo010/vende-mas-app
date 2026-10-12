import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { Menu } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showMenuButton?: boolean;
  rightElement?: ReactNode;
  className?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  showMenuButton = true,
  rightElement,
  className = '',
}: ScreenHeaderProps) {
  const navigation = useNavigation<{ openDrawer?: () => void }>();
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const handleOpenDrawer = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    if (navigation && typeof navigation.openDrawer === 'function') {
      navigation.openDrawer();
    }
  };

  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 bg-card border-b border-border ${className}`}
      style={{ elevation: 1 }}
    >
      <View className="flex-row items-center flex-1 mr-2">
        {showMenuButton ? (
          <Pressable
            testID="screen-header-menu-button"
            onPress={handleOpenDrawer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-muted active:opacity-70"
          >
            <Menu size={20} color={activeColors.foreground} />
          </Pressable>
        ) : null}

        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
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
  );
}
