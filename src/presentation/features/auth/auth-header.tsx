import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TrendingUp } from 'lucide-react-native';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export function AuthHeader() {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <Animated.View entering={FadeInDown.duration(600)} className="items-center justify-center mb-8">
      {/* Brand Icon Badge */}
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-sm">
        <TrendingUp size={32} color={activeColors.primary} strokeWidth={2.5} />
      </View>

      {/* Brand Title */}
      <Text className="text-3xl font-bold tracking-tight text-foreground text-center">
        Vende Más
      </Text>

      {/* Subtitle */}
      <Text className="mt-2 text-center text-sm text-muted-foreground max-w-xs leading-5">
        {es.auth.loginSubtitle}
      </Text>
    </Animated.View>
  );
}
