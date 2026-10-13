import { Pressable, Text, View } from 'react-native';
import { ChevronRight, Timer } from 'lucide-react-native';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { useNow } from '@/shared/hooks/use-now';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

export interface VisitInProgressBannerProps {
  visit: VisitEntity;
  onPress: (visit: VisitEntity) => void;
}

/** Fixed reminder of the open visit: "Visita en curso · Lubricadora El Pana · 12 min". */
export function VisitInProgressBanner({ visit, onPress }: VisitInProgressBannerProps) {
  const colors = useThemeColors();
  const now = useNow();
  const minutes = visit.elapsedMinutes(now) ?? 0;

  return (
    <Pressable
      testID="visit-in-progress-banner"
      accessibilityRole="button"
      onPress={() => onPress(visit)}
      className="mx-4 mt-3 flex-row items-center rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 active:opacity-80"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-warning/20">
        <Timer size={18} color={colors.warning} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-xs font-semibold uppercase text-warning">
          {es.agenda.inProgressBanner} · {minutes} {es.visits.minutes}
        </Text>
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {visit.customer?.tradeName ?? '—'}
        </Text>
      </View>
      <Text className="mr-1 text-sm font-semibold text-foreground">{es.agenda.resume}</Text>
      <ChevronRight size={18} color={colors.foreground} />
    </Pressable>
  );
}
