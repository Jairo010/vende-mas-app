import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { vars } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { ThemeProvider as NavigationThemeProvider } from 'expo-router';
import {
  NAVIGATION_THEMES,
  buildThemeVariables,
  useAppColorScheme,
  useThemeColors,
  type ColorSchemeName,
} from '@/theme';

const THEME_VARIABLES: Readonly<Record<ColorSchemeName, ReturnType<typeof vars>>> = {
  light: vars(buildThemeVariables('light')),
  dark: vars(buildThemeVariables('dark')),
};

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Applies the palette of the active scheme to the whole tree: CSS variables for
 * NativeWind classes, React Navigation theme, native root background and status bar.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const scheme = useAppColorScheme();
  const colors = useThemeColors();

  useEffect(() => {
    // Root window color: avoids a white flash behind screens in dark mode.
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  return (
    <View testID="theme-root" className="flex-1" style={THEME_VARIABLES[scheme]}>
      <NavigationThemeProvider value={NAVIGATION_THEMES[scheme]}>
        {children}
      </NavigationThemeProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}
