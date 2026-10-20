import { ActivityIndicator, View } from 'react-native';
import { useThemeColors } from '@/theme';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  /** `onPrimary`: on top of a primary / destructive button. */
  variant?: 'primary' | 'foreground' | 'onPrimary';
  className?: string;
}

export function LoadingSpinner({
  size = 'small',
  color,
  variant = 'primary',
  className = '',
}: LoadingSpinnerProps) {
  const colors = useThemeColors();

  const spinnerColor =
    color ??
    (variant === 'onPrimary'
      ? colors.primaryForeground
      : variant === 'foreground'
        ? colors.foreground
        : colors.primary);

  return (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={spinnerColor} />
    </View>
  );
}
