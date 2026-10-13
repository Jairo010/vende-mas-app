import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarX } from 'lucide-react-native';
import { useVisit } from '@/application/hooks/visits/use-visit';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { AlertBanner } from '@/presentation/components/feedback/alert-banner';
import { Badge } from '@/presentation/components/ui/badge';
import { Card } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import {
  VISIT_STATUS_VISUALS,
  VISIT_TYPE_VISUALS,
} from '@/presentation/features/visits/visit-visuals';
import { es } from '@/shared/i18n/es';
import { formatDateTime } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View className="flex-row justify-between border-b border-border py-2.5">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-sm font-medium text-foreground">
        {value || es.common.notAvailable}
      </Text>
    </View>
  );
}

/** Read-only visit summary; the step-by-step visit flow arrives in the next phase. */
export default function VisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { visit, isLoading } = useVisit(id);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={es.visits.detailTitle} onBack={() => router.back()} />
      {isLoading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </View>
      ) : !visit ? (
        <EmptyState
          icon={<CalendarX size={32} color={colors.mutedForeground} />}
          title={es.visits.notFound}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Card className="p-4">
            <Text className="text-lg font-bold text-foreground">
              {visit.customer?.tradeName ?? '—'}
            </Text>
            <View className="mt-2 flex-row gap-2">
              <Badge
                variant={VISIT_TYPE_VISUALS[visit.type].badgeVariant}
                label={VISIT_TYPE_VISUALS[visit.type].label}
              />
              <Badge
                variant={VISIT_STATUS_VISUALS[visit.status].badgeVariant}
                label={VISIT_STATUS_VISUALS[visit.status].label}
              />
            </View>
          </Card>

          <Card className="px-4 py-2">
            <Row label={es.visits.fields.scheduledAt} value={formatDateTime(visit.scheduledAt)} />
            <Row
              label={es.visits.fields.checkIn}
              value={visit.start ? formatDateTime(visit.start.at) : null}
            />
            <Row
              label={es.visits.fields.checkOut}
              value={visit.end ? formatDateTime(visit.end.at) : null}
            />
            <Row
              label={es.visits.fields.duration}
              value={
                visit.durationMinutes !== null
                  ? `${visit.durationMinutes} ${es.visits.minutes}`
                  : null
              }
            />
            <Row
              label={es.visits.fields.distance}
              value={
                visit.distanceToCustomerMeters !== null
                  ? `${Math.round(visit.distanceToCustomerMeters)} ${es.visits.meters}`
                  : null
              }
            />
            <Row
              label={es.visits.fields.outcome}
              value={visit.outcome ? es.visits.outcomes[visit.outcome] : null}
            />
            <Row label={es.visits.fields.notes} value={visit.notes} />
          </Card>

          <AlertBanner variant="info" message={es.visits.comingSoon} />
        </ScrollView>
      )}
    </View>
  );
}
