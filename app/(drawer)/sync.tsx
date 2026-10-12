import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshCw } from 'lucide-react-native';
import { ScreenHeader } from '@/presentation/components/common';
import { EmptyState } from '@/presentation/components/ui';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export default function SyncScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title={es.drawer.items.sync} subtitle="Sincronización local y estado offline" />
      <View className="flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<RefreshCw size={32} color={activeColors.primary} />}
          title="Sincronización de Datos"
          description="Todos tus datos locales están sincronizados con la nube de Vende Más."
          actionLabel="Forzar Sincronización"
          onActionPress={() => {}}
        />
      </View>
    </View>
  );
}
