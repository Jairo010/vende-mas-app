import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useLogin } from '@/application/hooks/auth/use-login';
import { loginSchema, type LoginFormData } from '@/application/schemas/auth.schema';
import { mmkvStorageAdapter } from '@/infrastructure/storage/mmkv-storage.adapter';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import { es } from '@/shared/i18n/es';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { Input } from '@/presentation/components/ui/input';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { AlertBanner } from '@/presentation/components/feedback/alert-banner';

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const { loginAsync, isPending, error, reset: resetMutation } = useLogin();

  const rememberedEmail = mmkvStorageAdapter.getString(STORAGE_KEYS.REMEMBERED_EMAIL);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedEmail ?? '',
      password: '',
      rememberMe: Boolean(rememberedEmail),
    },
    mode: 'onTouched',
  });

  const rememberMeValue = watch('rememberMe');

  useEffect(() => {
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      setValue('rememberMe', true);
    }
  }, [rememberedEmail, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    resetMutation();
    try {
      await loginAsync(data);
      onSuccess?.();
    } catch {
      // Error handled by mutation state and displayed in AlertBanner
    }
  };

  const handleToggleRemember = (value: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    setValue('rememberMe', value, { shouldDirty: true });
  };

  const handleToggleShowPassword = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowPassword((prev) => !prev);
  };

  return (
    <Animated.View entering={FadeInDown.duration(650).delay(100)} className="w-full">
      <Card className="rounded-3xl border border-border bg-card p-6">
        {/* Server Error Alert */}
        {error ? (
          <View className="mb-5">
            <AlertBanner
              variant="error"
              title={es.feedback.errorTitle}
              message={error.message || es.auth.errors.unexpected}
              dismissible
              onDismiss={resetMutation}
            />
          </View>
        ) : null}

        {/* Email Field */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Input
                testID="input-email"
                label={es.auth.emailLabel}
                placeholder={es.auth.emailPlaceholder}
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  if (error) resetMutation();
                }}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                leftIcon={<Mail size={18} color={activeColors.mutedForeground} />}
                showClearButton
                onClear={() => onChange('')}
              />
            </View>
          )}
        />

        {/* Password Field */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-3">
              <Input
                testID="input-password"
                label={es.auth.passwordLabel}
                placeholder={es.auth.passwordPlaceholder}
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  if (error) resetMutation();
                }}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Lock size={18} color={activeColors.mutedForeground} />}
                rightIcon={
                  <Pressable
                    testID="toggle-password-visibility"
                    onPress={handleToggleShowPassword}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-1.5 rounded-full"
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={activeColors.mutedForeground} />
                    ) : (
                      <Eye size={18} color={activeColors.mutedForeground} />
                    )}
                  </Pressable>
                }
              />
            </View>
          )}
        />

        {/* Remember Me & Forgot Password Row */}
        <View className="flex-row items-center justify-between mt-1 mb-6">
          <View className="flex-row items-center">
            <Switch
              testID="switch-remember-me"
              value={rememberMeValue}
              onValueChange={handleToggleRemember}
              trackColor={{
                false: activeColors.border,
                true: activeColors.primary,
              }}
              thumbColor={activeColors.background}
              className="scale-90"
            />
            <Text
              onPress={() => handleToggleRemember(!rememberMeValue)}
              className="ml-2 text-xs font-medium text-muted-foreground select-none"
            >
              {es.auth.rememberMe}
            </Text>
          </View>

          <Pressable
            testID="link-forgot-password"
            onPress={() => router.push('/(auth)/forgot-password' as never)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="py-1 px-1"
          >
            <Text className="text-xs font-semibold text-primary">{es.auth.forgotPassword}</Text>
          </Pressable>
        </View>

        {/* Submit Button */}
        <Button
          testID="button-submit"
          variant="default"
          size="default"
          isLoading={isPending || isSubmitting}
          onPress={handleSubmit(onSubmit)}
          className="w-full"
        >
          {isPending || isSubmitting ? es.auth.loggingIn : es.auth.submitButton}
        </Button>
      </Card>
    </Animated.View>
  );
}
