import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

export interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
}

export function AlertBanner({
  variant = 'error',
  title,
  message,
  onDismiss,
  dismissible = false,
  className = '',
}: AlertBannerProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bgColor: scheme === 'dark' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
          borderColor: scheme === 'dark' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(34, 197, 94, 0.3)',
          textColor: activeColors.success,
          icon: <CheckCircle2 size={20} color={activeColors.success} />,
        };
      case 'warning':
        return {
          bgColor: scheme === 'dark' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)',
          borderColor: scheme === 'dark' ? 'rgba(234, 179, 8, 0.35)' : 'rgba(234, 179, 8, 0.3)',
          textColor: activeColors.warning,
          icon: <AlertTriangle size={20} color={activeColors.warning} />,
        };
      case 'info':
        return {
          bgColor: scheme === 'dark' ? 'rgba(240, 62, 62, 0.12)' : 'rgba(229, 26, 26, 0.08)',
          borderColor: scheme === 'dark' ? 'rgba(240, 62, 62, 0.3)' : 'rgba(229, 26, 26, 0.25)',
          textColor: activeColors.primary,
          icon: <Info size={20} color={activeColors.primary} />,
        };
      case 'error':
      default:
        return {
          bgColor: scheme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
          borderColor: scheme === 'dark' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.3)',
          textColor: activeColors.destructive,
          icon: <AlertCircle size={20} color={activeColors.destructive} />,
        };
    }
  };

  const { bgColor, borderColor, textColor, icon } = getVariantStyles();

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutUp.duration(200)}
      className={`w-full flex-row items-start rounded-xl border p-3.5 ${className}`}
      style={{ backgroundColor: bgColor, borderColor: borderColor }}
    >
      <View className="mr-3 mt-0.5">{icon}</View>

      <View className="flex-1 pr-1">
        {title ? (
          <Text className="font-semibold text-sm mb-0.5" style={{ color: textColor }}>
            {title}
          </Text>
        ) : null}
        <Text className="text-xs leading-5 text-foreground font-normal">{message}</Text>
      </View>

      {dismissible && onDismiss ? (
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={onDismiss}
          className="ml-2 mt-0.5 p-1 rounded-full"
        >
          <X size={14} color={activeColors.mutedForeground} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
