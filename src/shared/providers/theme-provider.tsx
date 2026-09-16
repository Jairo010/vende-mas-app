import { useEffect, type ReactNode } from 'react';
import { useThemeStore } from '@/stores/theme.store';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode, setMode } = useThemeStore();

  useEffect(() => {
    // Re-apply saved mode on mount to ensure consistency
    if (mode !== 'system') {
      setMode(mode);
    }
  }, [mode, setMode]);

  return <>{children}</>;
}
