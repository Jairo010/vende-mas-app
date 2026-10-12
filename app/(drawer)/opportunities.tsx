import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Target } from 'lucide-react-native';
import { ScreenHeader } from '@/presentation/components/common';
import { EmptyState } from '@/presentation/components/ui';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title={es.drawer.items.opportunities}
        subtitle="Embudo de ventas y prospectos"
      />
      <View className="flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<Target size={32} color={activeColors.primary} />}
          title="Oportunidades Comerciales"
          description="Monitorea etapas de negociación, montos proyectados y probabilidades de cierre."
        />
      </View>
    </View>
  );
}
