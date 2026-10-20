import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeContainerVariants = cva('flex-row items-center self-start rounded-full border', {
  variants: {
    variant: {
      default: 'bg-muted border-border',
      primary: 'bg-primary/10 border-primary/30',
      success: 'bg-success/10 border-success/30',
      warning: 'bg-warning/10 border-warning/30',
      info: 'bg-info/10 border-info/30',
      destructive: 'bg-destructive/10 border-destructive/30',
      outline: 'bg-transparent border-border',
      opportunity: 'bg-visit-opportunity/10 border-visit-opportunity/30',
      order: 'bg-visit-order/10 border-visit-order/30',
      collection: 'bg-visit-collection/10 border-visit-collection/30',
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
      success: 'text-success',
      warning: 'text-warning',
      info: 'text-info',
      destructive: 'text-destructive',
      outline: 'text-foreground',
      opportunity: 'text-visit-opportunity',
      order: 'text-visit-order',
      collection: 'text-visit-collection',
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
