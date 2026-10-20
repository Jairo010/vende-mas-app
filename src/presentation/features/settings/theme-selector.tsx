import { SegmentedControl } from '@/presentation/components/ui/segmented-control';
import { es } from '@/shared/i18n/es';
import { useThemeStore, type ThemeMode } from '@/stores/theme.store';

const OPTIONS: readonly { value: ThemeMode; label: string }[] = [
  { value: 'light', label: es.more.themeLight },
  { value: 'dark', label: es.more.themeDark },
  { value: 'system', label: es.more.themeSystem },
];

/** Light / Dark / System. Applies instantly to the whole app (see ThemeProvider). */
export function ThemeSelector() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return <SegmentedControl options={OPTIONS} value={mode} onChange={setMode} />;
}
