import { Toaster } from 'sonner-native';
import { useAppColorScheme, useThemeColors, FONT_FAMILY } from '@/theme';

/**
 * Global toasts (sonner-native), themed from the palette. Show them with
 * `toast.success(...)` / `toast.error(...)` from 'sonner-native'.
 * The toaster renders in a native overlay, outside the CSS variables tree, so it takes
 * resolved colors instead of classes.
 */
export function AppToaster() {
  const scheme = useAppColorScheme();
  const colors = useThemeColors();

  return (
    <Toaster
      theme={scheme}
      position="top-center"
      duration={3500}
      swipeToDismissDirection="up"
      toastOptions={{
        style: {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 16,
        },
        titleStyle: { color: colors.foreground, fontFamily: FONT_FAMILY, fontWeight: '600' },
        descriptionStyle: { color: colors.mutedForeground, fontFamily: FONT_FAMILY },
      }}
    />
  );
}
