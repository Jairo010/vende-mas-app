import { useEffect, useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { vars } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { ThemeProvider as NavigationThemeProvider } from 'expo-router';
import {
  buildNavigationTheme,
  buildThemeVariables,
  useAppColorScheme,
  useBrandColor,
  useThemeColors,
} from '@/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Applies the palette of the active scheme (and the company brand as primary) to the whole
 * tree: CSS variables for NativeWind classes, React Navigation theme, native root background
 * and status bar.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const scheme = useAppColorScheme();
  const brandColor = useBrandColor();
  const colors = useThemeColors();
  const themeVariables = useMemo(
    () => vars(buildThemeVariables(scheme, brandColor)),
    [scheme, brandColor],
  );
  const navigationTheme = useMemo(
    () => buildNavigationTheme(scheme, brandColor),
    [scheme, brandColor],
  );

  useEffect(() => {
    // Root window color: avoids a white flash behind screens in dark mode.
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  return (
    <View testID="theme-root" className="flex-1" style={themeVariables}>
      <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}
