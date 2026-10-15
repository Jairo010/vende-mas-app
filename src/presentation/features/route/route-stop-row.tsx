import { Pressable, Text, View } from 'react-native';
import { Play } from 'lucide-react-native';
import type { VisitEntity } from '@/core/entities/visit.entity';
import type { RouteLeg } from '@/core/types/route.types';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';
import { formatDistance } from '../visits/location-quality';
import { VISIT_STATUS_VISUALS, VISIT_TYPE_VISUALS } from '../visits/visit-visuals';
import { formatDuration } from './route-format';

export interface RouteStopRowProps {
  position: number;
  visit: VisitEntity;
  leg: RouteLeg;
  isNext: boolean;
  onPress: (visit: VisitEntity) => void;
  /** Check-in shortcut, only for the next stop. */
  onStart?: (visit: VisitEntity) => void;
  isStarting?: boolean;
}

/** One stop of the route: order, customer, how long it takes to get there and its state. */
export function RouteStopRow({
  position,
  visit,
  leg,
  isNext,
  onPress,
  onStart,
  isStarting = false,
}: RouteStopRowProps) {
  const colors = useThemeColors();
  const type = VISIT_TYPE_VISUALS[visit.type];

  return (
    <Pressable
      testID={`route-stop-${visit.id}`}
      accessibilityRole="button"
      onPress={() => onPress(visit)}
      className={`flex-row items-center rounded-2xl border bg-card p-3 active:opacity-80 ${
        isNext ? 'border-primary' : 'border-border'
      }`}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: colors[type.token] }}
      >
        <Text className="text-sm font-bold" style={{ color: colors.primaryForeground }}>
          {position}
        </Text>
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {visit.customer?.tradeName ?? '—'}
        </Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {formatDuration(leg.durationSeconds)} · {formatDistance(leg.distanceMeters)}
          {visit.customer?.address ? ` · ${visit.customer.address}` : ''}
        </Text>
        <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
          {isNext ? <Badge size="sm" variant="primary" label={es.route.next} /> : null}
          <Badge size="sm" variant={type.badgeVariant} label={type.label} />
          {visit.status === 'IN_PROGRESS' ? (
            <Badge
              size="sm"
              variant={VISIT_STATUS_VISUALS.IN_PROGRESS.badgeVariant}
              label={VISIT_STATUS_VISUALS.IN_PROGRESS.label}
            />
          ) : null}
        </View>
      </View>

      {onStart ? (
        <Button
          testID={`route-start-${visit.id}`}
          size="sm"
          className="ml-2"
          isLoading={isStarting}
          leftIcon={<Play size={14} color={colors.primaryForeground} />}
          onPress={() => onStart(visit)}
        >
          {es.agenda.start}
        </Button>
      ) : null}
    </Pressable>
  );
}
