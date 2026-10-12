import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeContainerVariants = cva('flex-row items-center self-start rounded-full border', {
  variants: {
    variant: {
      default: 'bg-muted border-border',
      primary: 'bg-primary/10 border-primary/30',
      success: 'bg-emerald-500/10 border-emerald-500/30',
      warning: 'bg-amber-500/10 border-amber-500/30',
      destructive: 'bg-destructive/10 border-destructive/30',
      outline: 'bg-transparent border-border',
      call: 'bg-blue-500/10 border-blue-500/30',
      visit: 'bg-primary/10 border-primary/30',
      payment: 'bg-emerald-500/10 border-emerald-500/30',
      delivery: 'bg-sky-500/10 border-sky-500/30',
      followUp: 'bg-purple-500/10 border-purple-500/30',
    },
    size: {
      sm: 'px-2 py-0.5',
      default: 'px-2.5 py-1',
      lg: 'px-3 py-1.5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const badgeTextVariants = cva('font-medium', {
  variants: {
    variant: {
      default: 'text-muted-foreground',
      primary: 'text-primary',
      success: 'text-emerald-600 dark:text-emerald-400',
      warning: 'text-amber-600 dark:text-amber-400',
      destructive: 'text-destructive',
      outline: 'text-foreground',
      call: 'text-blue-600 dark:text-blue-400',
      visit: 'text-primary',
      payment: 'text-emerald-600 dark:text-emerald-400',
      delivery: 'text-sky-600 dark:text-sky-400',
      followUp: 'text-purple-600 dark:text-purple-400',
    },
    size: {
      sm: 'text-[11px] leading-tight',
      default: 'text-xs leading-none',
      lg: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface BadgeProps extends ViewProps, VariantProps<typeof badgeContainerVariants> {
  children?: ReactNode;
  label?: string;
  icon?: ReactNode;
  className?: string;
}

export function Badge({
  children,
  label,
  icon,
  variant = 'default',
  size = 'default',
  className = '',
  ...props
}: BadgeProps) {
  const content = label ?? children;

  return (
    <View className={`${badgeContainerVariants({ variant, size })} ${className}`} {...props}>
      {icon ? <View className="mr-1">{icon}</View> : null}
      {typeof content === 'string' ? (
        <Text className={badgeTextVariants({ variant, size })}>{content}</Text>
      ) : (
        content
      )}
    </View>
  );
}
