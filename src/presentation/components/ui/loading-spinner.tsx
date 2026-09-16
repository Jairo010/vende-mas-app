import { ActivityIndicator, View } from 'react-native';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  variant?: 'primary' | 'foreground' | 'white';
  className?: string;
}

export function LoadingSpinner({
  size = 'small',
  color,
  variant = 'primary',
  className = '',
}: LoadingSpinnerProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const spinnerColor =
    color ??
    (variant === 'white'
      ? '#FFFFFF'
      : variant === 'foreground'
        ? activeColors.foreground
        : activeColors.primary);

  return (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={spinnerColor} />
    </View>
  );
}
