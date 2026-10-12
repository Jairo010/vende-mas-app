import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package } from 'lucide-react-native';
import { ScreenHeader } from '@/presentation/components/common';
import { EmptyState } from '@/presentation/components/ui';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title={es.drawer.items.catalog} subtitle="Inventario y catálogo de productos" />
      <View className="flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<Package size={32} color={activeColors.primary} />}
          title="Catálogo de Productos"
          description="Explora precios, existencias por almacén y fichas técnicas de productos."
        />
      </View>
    </View>
  );
}
