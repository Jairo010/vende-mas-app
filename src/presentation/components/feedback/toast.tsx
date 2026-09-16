import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  visible: boolean;
  type?: ToastType;
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ visible, type = 'info', message, duration = 3500, onDismiss }: ToastProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    if (!visible) return;

    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }

    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, type, duration, onDismiss]);

  if (!visible) return null;

  const icon =
    type === 'success' ? (
      <CheckCircle2 size={18} color={activeColors.success} />
    ) : type === 'error' ? (
      <AlertCircle size={18} color={activeColors.destructive} />
    ) : (
      <Info size={18} color={activeColors.primary} />
    );

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16)}
      exiting={FadeOutUp.duration(200)}
      className="absolute top-12 left-4 right-4 z-50 flex-row items-center rounded-2xl border border-border bg-card px-4 py-3.5"
      style={{ elevation: 6 }}
    >
      <View className="mr-3">{icon}</View>
      <Text className="flex-1 text-sm font-medium text-foreground">{message}</Text>
      <Pressable
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="ml-2 p-1 rounded-full"
      >
        <X size={16} color={activeColors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}
