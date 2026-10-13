import { Pressable, Text, View } from 'react-native';
import { CloudUpload, MapPin } from 'lucide-react-native';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { Badge } from '@/presentation/components/ui/badge';
import { formatTime } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';
import { VISIT_STATUS_VISUALS, VISIT_TYPE_VISUALS } from './visit-visuals';

export interface VisitCardProps {
  visit: VisitEntity;
  onPress?: (visit: VisitEntity) => void;
}

/** Agenda row: time, type (color + icon), customer, status and pending-sync mark. */
export function VisitCard({ visit, onPress }: VisitCardProps) {
  const colors = useThemeColors();
  const type = VISIT_TYPE_VISUALS[visit.type];
  const status = VISIT_STATUS_VISUALS[visit.status];
  const TypeIcon = type.icon;

  return (
    <Pressable
      testID={`visit-card-${visit.id}`}
      accessibilityRole="button"
      onPress={() => onPress?.(visit)}
      className={`flex-row rounded-2xl border border-border border-l-4 bg-card p-4 active:opacity-80 ${type.borderClass}`}
    >
      <View className="mr-3 w-12 items-center">
        <Text className="text-base font-bold text-foreground">{formatTime(visit.scheduledAt)}</Text>
        <View className="mt-2 h-8 w-8 items-center justify-center rounded-xl bg-muted">
          <TypeIcon size={16} color={colors[type.token]} />
        </View>
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {visit.customer?.tradeName ?? '—'}
        </Text>
        {visit.customer?.address ? (
          <View className="mt-1 flex-row items-center">
            <MapPin size={12} color={colors.mutedForeground} />
            <Text className="ml-1 flex-1 text-xs text-muted-foreground" numberOfLines={1}>
              {visit.customer.address}
            </Text>
          </View>
        ) : null}
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          <Badge size="sm" variant={type.badgeVariant} label={type.label} />
          <Badge size="sm" variant={status.badgeVariant} label={status.label} />
          {visit.syncStatus !== 'SYNCED' ? (
            <CloudUpload
              testID="visit-pending-sync"
              size={14}
              color={visit.syncStatus === 'REJECTED' ? colors.destructive : colors.warning}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
