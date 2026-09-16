import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { AppProviders } from '@/shared/providers/app-providers';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';

// Suppress strict mode shared value render warnings from libraries/interop
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const themeHydrated = useThemeStore((state) => state.isHydrated);
  const scheme = useThemeStore((state) => state.getEffectiveScheme());

  useEffect(() => {
    if (!authHydrated || !themeHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authHydrated, themeHydrated, segments, router]);

  if (!authHydrated || !themeHydrated) {
    return null;
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AuthGuard />
    </AppProviders>
  );
}
