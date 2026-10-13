import type { ReactNode } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import {
  CalendarClock,
  CloudUpload,
  MapPin,
  Navigation,
  Phone,
  UserRound,
} from 'lucide-react-native';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { Avatar } from '@/presentation/components/ui/avatar';
import { Badge } from '@/presentation/components/ui/badge';
import { Card } from '@/presentation/components/ui/card';
import { es } from '@/shared/i18n/es';
import { formatDateTime } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';
import { VISIT_STATUS_VISUALS, VISIT_TYPE_VISUALS } from './visit-visuals';

export interface VisitHeaderCardProps {
  visit: VisitEntity;
  /** Shows who the visit is assigned to (supervisors looking at a seller's visit). */
  showSeller?: boolean;
}

function QuickAction({
  label,
  icon,
  onPress,
  testID,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center rounded-xl border border-border py-2.5 active:bg-muted"
    >
      {icon}
      <Text className="ml-2 text-sm font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}

/** Who and when: customer, visit type and status, contact shortcuts. */
export function VisitHeaderCard({ visit, showSeller = false }: VisitHeaderCardProps) {
  const colors = useThemeColors();
  const type = VISIT_TYPE_VISUALS[visit.type];
  const status = VISIT_STATUS_VISUALS[visit.status];
  const customer = visit.customer;
  const hasLocation = customer?.latitude != null && customer.longitude != null;

  const call = () => {
    if (customer?.phone) Linking.openURL(`tel:${customer.phone}`).catch(() => {});
  };

  const openMap = () => {
    if (!hasLocation) return;
    const query = `${customer.latitude},${customer.longitude}`;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  };

  return (
    <Card className="p-4">
      <View className="flex-row items-center">
        <Avatar name={customer?.tradeName ?? '?'} imageUri={customer?.storePhotoUrl} size="md" />
        <View className="ml-3 flex-1">
          <Text className="text-lg font-bold text-foreground" numberOfLines={2}>
            {customer?.tradeName ?? '—'}
          </Text>
          {customer?.contactName ? (
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
              {customer.contactName}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        <Badge variant={type.badgeVariant} label={type.label} />
        <Badge variant={status.badgeVariant} label={status.label} />
        {customer?.status === 'PROSPECT' ? (
          <Badge variant="outline" label={es.customers.statuses.PROSPECT} />
        ) : null}
        {visit.syncStatus !== 'SYNCED' ? (
          <CloudUpload
            size={16}
            color={visit.syncStatus === 'REJECTED' ? colors.destructive : colors.warning}
          />
        ) : null}
      </View>

      <View className="mt-3 gap-1.5">
        <View className="flex-row items-center">
          <CalendarClock size={14} color={colors.mutedForeground} />
          <Text className="ml-2 text-sm text-foreground">{formatDateTime(visit.scheduledAt)}</Text>
        </View>
        {customer?.address ? (
          <View className="flex-row items-center">
            <MapPin size={14} color={colors.mutedForeground} />
            <Text className="ml-2 flex-1 text-sm text-muted-foreground" numberOfLines={2}>
              {customer.address}
            </Text>
          </View>
        ) : null}
        {showSeller && visit.sellerName ? (
          <View className="flex-row items-center">
            <UserRound size={14} color={colors.mutedForeground} />
            <Text className="ml-2 text-sm text-muted-foreground">
              {es.visits.fields.seller}: {visit.sellerName}
            </Text>
          </View>
        ) : null}
      </View>

      {customer?.phone || hasLocation ? (
        <View className="mt-4 flex-row gap-2">
          {customer?.phone ? (
            <QuickAction
              testID="visit-call"
              label={es.visits.actions.call}
              icon={<Phone size={16} color={colors.primary} />}
              onPress={call}
            />
          ) : null}
          {hasLocation ? (
            <QuickAction
              testID="visit-open-map"
              label={es.visits.actions.openMap}
              icon={<Navigation size={16} color={colors.primary} />}
              onPress={openMap}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
