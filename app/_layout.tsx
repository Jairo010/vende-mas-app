import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/shared/providers/app-providers';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';

function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isHydrated: authHydrated } = useAuthStore();
  const { isHydrated: themeHydrated, getEffectiveScheme } = useThemeStore();

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

  const scheme = getEffectiveScheme();

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
