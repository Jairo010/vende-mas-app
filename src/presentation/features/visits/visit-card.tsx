import { Pressable, Text, View } from 'react-native';
import { Clock, CloudUpload, MapPin, Play } from 'lucide-react-native';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { es } from '@/shared/i18n/es';
import { formatTime } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';
import { formatVisitTime } from './visit-schedule';
import { VISIT_STATUS_VISUALS, VISIT_TYPE_VISUALS } from './visit-visuals';

export interface VisitCardProps {
  visit: VisitEntity;
  onPress?: (visit: VisitEntity) => void;
  /** Shows the "Iniciar" shortcut (check-in from the agenda). */
  onStart?: (visit: VisitEntity) => void;
  isStarting?: boolean;
  /** The type badge is redundant inside a group of visits of the same type. */
  showType?: boolean;
}

/** `Inicio 09:12 · Fin 09:40 (28 min)`: when the visit really happened. */
function actualTimes(visit: VisitEntity): string | null {
  if (!visit.start) return null;
  const start = `${es.visits.fields.checkIn} ${formatTime(visit.start.at)}`;
  if (!visit.end) return start;
  const minutes = visit.elapsedMinutes();
  const duration = minutes !== null ? ` (${minutes} ${es.visits.minutes})` : '';
  return `${start} · ${es.visits.fields.checkOut} ${formatTime(visit.end.at)}${duration}`;
}

/**
 * Agenda row: agreed time (when there is one), type (color + icon), customer, status, the real
 * start / end times and the pending-sync mark.
 */
export function VisitCard({
  visit,
  onPress,
  onStart,
  isStarting = false,
  showType = true,
}: VisitCardProps) {
  const colors = useThemeColors();
  const type = VISIT_TYPE_VISUALS[visit.type];
  const status = VISIT_STATUS_VISUALS[visit.status];
  const TypeIcon = type.icon;
  const scheduledTime = formatVisitTime(visit);
  const times = actualTimes(visit);

  return (
    <Pressable
      testID={`visit-card-${visit.id}`}
      accessibilityRole="button"
      onPress={() => onPress?.(visit)}
      className={`flex-row rounded-2xl border border-border border-l-4 bg-card p-4 active:opacity-80 ${type.borderClass}`}
    >
      <View className="mr-3 w-12 items-center">
        {scheduledTime ? (
          <Text className="mb-2 text-base font-bold text-foreground">{scheduledTime}</Text>
        ) : null}
        <View className="h-8 w-8 items-center justify-center rounded-xl bg-muted">
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
        {times ? (
          <View className="mt-1 flex-row items-center">
            <Clock size={12} color={colors.mutedForeground} />
            <Text
              testID={`visit-card-times-${visit.id}`}
              className="ml-1 flex-1 text-xs text-muted-foreground"
              numberOfLines={1}
            >
              {times}
            </Text>
          </View>
        ) : null}
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          {showType ? <Badge size="sm" variant={type.badgeVariant} label={type.label} /> : null}
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

      {onStart ? (
        <View className="ml-2 justify-center">
          <Button
            testID={`visit-card-start-${visit.id}`}
            size="sm"
            isLoading={isStarting}
            leftIcon={<Play size={14} color={colors.primaryForeground} />}
            onPress={() => onStart(visit)}
          >
            {es.agenda.start}
          </Button>
        </View>
      ) : null}
    </Pressable>
  );
}
