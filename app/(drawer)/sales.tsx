import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart } from 'lucide-react-native';
import { ScreenHeader } from '@/presentation/components/common';
import { EmptyState } from '@/presentation/components/ui';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title={es.drawer.items.sales} subtitle="Registro y seguimiento de pedidos" />
      <View className="flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<ShoppingCart size={32} color={activeColors.primary} />}
          title="Ventas y Pedidos"
          description="Genera pedidos móviles, consulta cotizaciones y revisa estados de entrega."
        />
      </View>
    </View>
  );
}
