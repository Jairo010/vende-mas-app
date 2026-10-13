import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AppToaster } from '@/presentation/components/feedback/app-toaster';
import { ErrorBoundary } from '@/presentation/components/feedback/error-boundary';
import { DatabaseProvider } from './database-provider';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Order matters: the theme (CSS variables) wraps everything that renders classes,
 * including bottom sheets (their portal lives in BottomSheetModalProvider).
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <QueryProvider>
              <DatabaseProvider>
                <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
              </DatabaseProvider>
            </QueryProvider>
          </ErrorBoundary>
          <AppToaster />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
