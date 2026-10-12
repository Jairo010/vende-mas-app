import { Linking, Pressable, Text, View } from 'react-native';
import {
  Clock,
  MapPin,
  ArrowRight,
  RotateCw,
  Camera,
  User,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import type { TaskHistoryItem } from '@/core/types/task.types';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface TaskHistoryTimelineProps {
  history?: TaskHistoryItem[];
  onPhotoPress?: (photoUrl: string) => void;
}

export function TaskHistoryTimeline({ history = [], onPhotoPress }: TaskHistoryTimelineProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  if (history.length === 0) {
    return (
      <View className="py-6 items-center justify-center rounded-2xl bg-muted/30 border border-border">
        <Clock size={24} color={activeColors.mutedForeground} />
        <Text className="text-xs text-muted-foreground mt-1.5 text-center px-4">
          {es.tasks.detail.noHistory}
        </Text>
      </View>
    );
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleOpenMap = (lat: number, lng: number) => {
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
  };

  // Sort history newest first
  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <View className="relative pl-3">
      {/* Vertical line connecting nodes */}
      <View className="absolute left-6 top-3 bottom-4 w-0.5 bg-border" />

      <View className="gap-y-4">
        {sorted.map((item, index) => {
          const isTransition = item.fromType && item.fromType !== item.toType;
          const isStatusChange = item.fromStatus && item.fromStatus !== item.toStatus;

          return (
            <View key={item.id || index} className="flex-row items-start">
              {/* Node dot */}
              <View
                className={`h-7 w-7 rounded-full items-center justify-center mr-3 border-2 border-card ${
                  item.toStatus === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : item.toStatus === 'LOST'
                      ? 'bg-rose-500'
                      : item.toStatus === 'COLLECTED'
                        ? 'bg-teal-500'
                        : isTransition
                          ? 'bg-purple-500'
                          : 'bg-primary'
                }`}
                style={{ elevation: 2 }}
              >
                {item.toStatus === 'COMPLETED' ? (
                  <CheckCircle2 size={13} color="#ffffff" />
                ) : item.toStatus === 'LOST' ? (
                  <XCircle size={13} color="#ffffff" />
                ) : isTransition ? (
                  <ArrowRight size={13} color="#ffffff" />
                ) : (
                  <RotateCw size={12} color="#ffffff" />
                )}
              </View>

              {/* Event card */}
              <View className="flex-1 p-3.5 rounded-2xl bg-card border border-border">
                {/* Event header */}
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-bold text-foreground">
                    {isTransition
                      ? `Transición: ${item.fromType} ➔ ${item.toType}`
                      : isStatusChange
                        ? `Estado: ${item.fromStatus} ➔ ${item.toStatus}`
                        : `Registro: ${item.toType}`}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground font-medium">
                    {formatTimestamp(item.createdAt)}
                  </Text>
                </View>

                {/* Author User */}
                {item.user ? (
                  <View className="flex-row items-center mt-0.5">
                    <User size={11} color={activeColors.mutedForeground} className="mr-1" />
                    <Text className="text-[11px] text-muted-foreground">
                      {item.user.name || item.user.email}
                    </Text>
                  </View>
                ) : null}

                {/* Reason / Observation Notes */}
                {item.notes ? (
                  <Text className="text-xs text-foreground mt-2 bg-muted/40 p-2 rounded-xl">
                    "{item.notes}"
                  </Text>
                ) : null}

                {/* Badges / Attachments row */}
                <View className="flex-row items-center mt-2.5 flex-wrap gap-2">
                  {/* GPS Badge */}
                  {item.latitude !== null && item.longitude !== null ? (
                    <Pressable
                      onPress={() => handleOpenMap(item.latitude!, item.longitude!)}
                      className="flex-row items-center px-2 py-1 rounded-lg bg-muted border border-border"
                    >
                      <MapPin size={11} color={activeColors.primary} className="mr-1" />
                      <Text className="text-[10px] font-medium text-foreground">
                        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                      </Text>
                    </Pressable>
                  ) : null}

                  {/* Photo thumbnail */}
                  {item.photoUrl ? (
                    <Pressable
                      onPress={() => onPhotoPress?.(item.photoUrl!)}
                      className="flex-row items-center px-2 py-1 rounded-lg bg-muted border border-border"
                    >
                      <Camera size={11} color={activeColors.foreground} className="mr-1" />
                      <Text className="text-[10px] font-medium text-foreground">Ver Foto</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
