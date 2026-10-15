import { Text, View } from 'react-native';
import { Map as MapIcon, Navigation, RefreshCw } from 'lucide-react-native';
import type { RoutePlan } from '@/core/types/route.types';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { es } from '@/shared/i18n/es';
import { formatTime } from '@/shared/utils/date';
import { MAX_DIRECTIONS_WAYPOINTS } from '@/shared/utils/maps-links';
import { useThemeColors } from '@/theme';
import { formatDistance } from '../visits/location-quality';
import { formatDuration } from './route-format';

export interface RouteSummaryCardProps {
  plan: RoutePlan;
  isComputing: boolean;
  onRecompute: () => void;
  onNavigateNext: () => void;
  onOpenFullRoute: () => void;
}

/** Totals of what is left, how the route was computed, and the Google Maps shortcuts. */
export function RouteSummaryCard({
  plan,
  isComputing,
  onRecompute,
  onNavigateNext,
  onOpenFullRoute,
}: RouteSummaryCardProps) {
  const colors = useThemeColors();
  const isEstimate = plan.provider === 'ESTIMATE';

  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className="text-xs text-muted-foreground">{es.route.total}</Text>
          <Text className="text-xl font-bold text-foreground">
            {formatDuration(plan.totalDurationSeconds)} · {formatDistance(plan.totalDistanceMeters)}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {es.route.stops}: {plan.legs.length} · {es.route.updatedAt}{' '}
            {formatTime(plan.computedAt)}
          </Text>
        </View>
        <Button
          testID="route-recompute"
          variant="ghost"
          size="sm"
          isLoading={isComputing}
          leftIcon={<RefreshCw size={14} color={colors.foreground} />}
          onPress={onRecompute}
        >
          {es.route.recompute}
        </Button>
      </View>

      <Badge
        size="sm"
        variant={isEstimate ? 'warning' : 'success'}
        label={es.route.providers[plan.provider]}
      />
      {isEstimate ? (
        <Text className="text-xs leading-4 text-muted-foreground">{es.route.estimateHint}</Text>
      ) : null}

      <View className="flex-row gap-2">
        <Button
          testID="route-navigate-next"
          className="flex-1"
          leftIcon={<Navigation size={16} color={colors.primaryForeground} />}
          onPress={onNavigateNext}
        >
          {es.route.navigateNext}
        </Button>
        <Button
          testID="route-open-full"
          variant="outline"
          className="flex-1"
          leftIcon={<MapIcon size={16} color={colors.foreground} />}
          onPress={onOpenFullRoute}
        >
          {es.route.openFullRoute}
        </Button>
      </View>
      {plan.legs.length > MAX_DIRECTIONS_WAYPOINTS + 1 ? (
        <Text className="text-xs text-muted-foreground">{es.route.fullRouteLimit}</Text>
      ) : null}
    </Card>
  );
}
