import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { ScreenHeader } from '@/presentation/components/common';
import { EmptyState } from '@/presentation/components/ui';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export default function VisitsScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title={es.drawer.items.visits} subtitle="Rutas geolocalizadas de campo" />
      <View className="flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<MapPin size={32} color={activeColors.primary} />}
          title="Rutas de Visita"
          description="Planifica y registra check-in de tus visitas presenciales a clientes en el mapa."
        />
      </View>
    </View>
  );
}
