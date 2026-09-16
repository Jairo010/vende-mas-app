import type { ReactNode } from 'react';
import { Pressable, Text, type GestureResponderEvent, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoadingSpinner } from './loading-spinner';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-xl font-semibold overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary active:opacity-90',
        secondary: 'bg-secondary active:opacity-90',
        outline: 'border border-border bg-transparent active:bg-muted',
        ghost: 'bg-transparent active:bg-muted',
        destructive: 'bg-destructive active:opacity-90',
      },
      size: {
        sm: 'h-9 px-3 py-1.5',
        default: 'h-12 px-5 py-3',
        lg: 'h-14 px-7 py-3.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonTextVariants = cva('font-semibold text-center select-none', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-destructive-foreground',
    },
    size: {
      sm: 'text-xs',
      default: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps
  extends Omit<PressableProps, 'children'>, VariantProps<typeof buttonVariants> {
  children: ReactNode;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  enableHaptics?: boolean;
  className?: string;
  textClassName?: string;
}

export function Button({
  children,
  variant = 'default',
  size = 'default',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  enableHaptics = true,
  className = '',
  textClassName = '',
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: GestureResponderEvent) => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    onPressOut?.(e);
  };

  const handlePress = async (e: GestureResponderEvent) => {
    if (disabled || isLoading) return;
    if (enableHaptics) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics unavailable
      }
    }
    onPress?.(e);
  };

  const isDisabled = disabled || isLoading;

  return (
    <AnimatedPressable
      disabled={isDisabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className={`${buttonVariants({ variant, size })} ${isDisabled ? 'opacity-60' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner
          size="small"
          variant={variant === 'outline' || variant === 'ghost' ? 'foreground' : 'white'}
        />
      ) : (
        <>
          {leftIcon ? <>{leftIcon}</> : null}
          {typeof children === 'string' ? (
            <Text
              className={`${buttonTextVariants({ variant, size })} ${leftIcon ? 'ml-2' : ''} ${rightIcon ? 'mr-2' : ''} ${textClassName}`}
            >
              {children}
            </Text>
          ) : (
            children
          )}
          {rightIcon ? <>{rightIcon}</> : null}
        </>
      )}
    </AnimatedPressable>
  );
}
