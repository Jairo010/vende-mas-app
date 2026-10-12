import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { Button } from './button';

export interface EmptyStateProps extends ViewProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
  secondaryActionLabel,
  onSecondaryActionPress,
  className = '',
  ...props
}: EmptyStateProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <View className={`items-center justify-center px-6 py-12 ${className}`} {...props}>
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border">
        {icon ?? <Inbox size={32} color={activeColors.mutedForeground} />}
      </View>

      <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>

      {description ? (
        <Text className="mt-2 text-center text-sm text-muted-foreground leading-relaxed max-w-xs">
          {description}
        </Text>
      ) : null}

      {actionLabel && onActionPress ? (
        <View className="mt-6 w-full max-w-xs">
          <Button variant="default" size="default" onPress={onActionPress}>
            {actionLabel}
          </Button>
        </View>
      ) : null}

      {secondaryActionLabel && onSecondaryActionPress ? (
        <View className="mt-2 w-full max-w-xs">
          <Button variant="ghost" size="sm" onPress={onSecondaryActionPress}>
            {secondaryActionLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
