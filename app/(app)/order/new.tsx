import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

/** Route reserved for taking an order with the offline catalog. */
export default function NewOrderScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={es.orders.newTitle} onBack={() => router.back()} />
      <EmptyState
        icon={<ShoppingCart size={32} color={colors.primary} />}
        title={es.orders.newTitle}
        description={es.orders.comingSoon}
      />
    </View>
  );
}
