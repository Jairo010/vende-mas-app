import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarPlus } from 'lucide-react-native';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

/** Route reserved for the "new visit" wizard (type → customer → date → notes). */
export default function NewVisitScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={es.visits.newTitle} onBack={() => router.back()} />
      <EmptyState
        icon={<CalendarPlus size={32} color={colors.primary} />}
        title={es.visits.newTitle}
        description={es.visits.comingSoon}
      />
    </View>
  );
}
