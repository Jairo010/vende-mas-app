import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { AlertCircle, X } from 'lucide-react-native';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClear?: () => void;
  showClearButton?: boolean;
  containerClassName?: string;
  inputClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      onClear,
      showClearButton,
      value,
      containerClassName = '',
      inputClassName = '',
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const scheme = useThemeStore((state) => state.getEffectiveScheme());
    const activeColors = scheme === 'dark' ? darkColors : lightColors;

    const hasError = Boolean(error);

    const borderColor = hasError
      ? activeColors.destructive
      : isFocused
        ? activeColors.primary
        : activeColors.border;

    const borderWidth = isFocused || hasError ? 1.5 : 1;

    const canShowClear = Boolean(showClearButton && value && value.length > 0 && onClear);

    return (
      <View className={`w-full ${containerClassName}`}>
        {label ? <Text className="mb-2 text-sm font-medium text-foreground">{label}</Text> : null}

        <View
          className="flex-row items-center w-full min-h-[48px] rounded-xl bg-card px-3.5"
          style={{
            borderColor,
            borderWidth,
          }}
        >
          {leftIcon ? <View className="mr-2.5 items-center justify-center">{leftIcon}</View> : null}

          <TextInput
            ref={ref}
            value={value}
            placeholderTextColor={activeColors.mutedForeground}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className={`flex-1 py-3 text-base text-foreground font-normal ${inputClassName}`}
            {...props}
          />

          {canShowClear ? (
            <Pressable
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={onClear}
              className="mr-1.5 p-1 rounded-full bg-muted"
            >
              <X size={14} color={activeColors.mutedForeground} />
            </Pressable>
          ) : null}

          {rightIcon ? <View className="ml-1 items-center justify-center">{rightIcon}</View> : null}
        </View>

        {error ? (
          <Animated.View
            entering={FadeInDown.duration(200)}
            exiting={FadeOutUp.duration(150)}
            className="flex-row items-center mt-1.5 ml-0.5"
          >
            <AlertCircle size={14} color={activeColors.destructive} />
            <Text className="ml-1.5 text-xs font-medium text-destructive">{error}</Text>
          </Animated.View>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';
