import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import { useThemeColors, type ThemeToken } from '@/theme';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

export interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
}

const VARIANTS: Record<
  AlertVariant,
  { container: string; title: string; token: ThemeToken; Icon: typeof Info }
> = {
  success: {
    container: 'bg-success/10 border-success/30',
    title: 'text-success',
    token: 'success',
    Icon: CheckCircle2,
  },
  warning: {
    container: 'bg-warning/10 border-warning/30',
    title: 'text-warning',
    token: 'warning',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-info/10 border-info/30',
    title: 'text-info',
    token: 'info',
    Icon: Info,
  },
  error: {
    container: 'bg-destructive/10 border-destructive/30',
    title: 'text-destructive',
    token: 'destructive',
    Icon: AlertCircle,
  },
};

export function AlertBanner({
  variant = 'error',
  title,
  message,
  onDismiss,
  dismissible = false,
  className = '',
}: AlertBannerProps) {
  const colors = useThemeColors();
  const { container, title: titleClass, token, Icon } = VARIANTS[variant];

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutUp.duration(200)}
      className={`w-full flex-row items-start rounded-xl border p-3.5 ${container} ${className}`}
    >
      <View className="mr-3 mt-0.5">
        <Icon size={20} color={colors[token]} />
      </View>

      <View className="flex-1 pr-1">
        {title ? (
          <Text className={`font-semibold text-sm mb-0.5 ${titleClass}`}>{title}</Text>
        ) : null}
        <Text className="text-xs leading-5 text-foreground font-normal">{message}</Text>
      </View>

      {dismissible && onDismiss ? (
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={onDismiss}
          className="ml-2 mt-0.5 p-1 rounded-full"
        >
          <X size={14} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
