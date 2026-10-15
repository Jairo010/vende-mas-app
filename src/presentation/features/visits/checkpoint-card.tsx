import { Text, View } from 'react-native';
import { LogIn, LogOut, MapPinOff, Ruler, Satellite } from 'lucide-react-native';
import type { VisitCheckpoint } from '@/core/types/visit.types';
import { Card } from '@/presentation/components/ui/card';
import { es } from '@/shared/i18n/es';
import { formatTime } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';
import {
  distanceToken,
  formatDistance,
  LOCATION_QUALITY_TOKENS,
  locationQuality,
} from './location-quality';

export interface CheckpointCardProps {
  kind: 'checkIn' | 'checkOut';
  checkpoint: VisitCheckpoint;
  /** Only the check-in carries the distance to the store. */
  distanceToCustomerMeters?: number | null;
  /** Elapsed or total minutes, shown next to the time. */
  minutes?: number | null;
  /** GPS quality and distance (admins and supervisors only). */
  showLocation?: boolean;
}

/**
 * When the seller arrived / left and, for admins and supervisors, where: GPS quality and
 * distance to the store.
 */
export function CheckpointCard({
  kind,
  checkpoint,
  distanceToCustomerMeters,
  minutes,
  showLocation = false,
}: CheckpointCardProps) {
  const colors = useThemeColors();
  const Icon = kind === 'checkIn' ? LogIn : LogOut;
  const accuracy = checkpoint.location?.accuracyMeters;
  const quality = locationQuality(accuracy);

  return (
    <Card className="p-4">
      <View className="flex-row items-center">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted">
          <Icon size={18} color={colors.foreground} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-sm text-muted-foreground">{es.visits.steps[kind]}</Text>
          <Text className="text-base font-semibold text-foreground">
            {formatTime(checkpoint.at)}
            {minutes !== null && minutes !== undefined
              ? `  ·  ${minutes} ${es.visits.minutes}`
              : ''}
          </Text>
        </View>
      </View>

      {showLocation ? (
        <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-2">
          {checkpoint.location ? (
            <View className="flex-row items-center">
              <Satellite
                size={14}
                color={quality ? colors[LOCATION_QUALITY_TOKENS[quality]] : colors.mutedForeground}
              />
              <Text className="ml-1.5 text-sm text-foreground">
                {es.visits.fields.accuracy}:{' '}
                {accuracy !== undefined ? `±${Math.round(accuracy)} ${es.visits.meters}` : '—'}
                {quality ? ` (${es.visits.gps.quality[quality]})` : ''}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <MapPinOff size={14} color={colors.mutedForeground} />
              <Text className="ml-1.5 text-sm text-muted-foreground">
                {es.visits.gps.noLocation}
              </Text>
            </View>
          )}

          {distanceToCustomerMeters !== null && distanceToCustomerMeters !== undefined ? (
            <View className="flex-row items-center">
              <Ruler size={14} color={colors[distanceToken(distanceToCustomerMeters)]} />
              <Text className="ml-1.5 text-sm text-foreground">
                {es.visits.fields.distance}: {formatDistance(distanceToCustomerMeters)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
