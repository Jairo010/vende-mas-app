import { Pressable, Text, View } from 'react-native';
import { Check, Building2, AlertTriangle, MapPin, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { TaskStatus } from '@/core/types/task.types';
import { Badge } from '@/presentation/components/ui/badge';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { getStatusVisual, getTypeVisual } from './task-visuals';

export interface TaskCardProps {
  task: TaskEntity;
  onPress: (task: TaskEntity) => void;
  onToggleStatus: (id: string, currentStatus: TaskStatus) => void;
  className?: string;
}

export function TaskCard({ task, onPress, onToggleStatus, className = '' }: TaskCardProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const typeVisual = getTypeVisual(task.type || task.category);
  const statusVisual = getStatusVisual(task.status);
  const isCompleted = task.isCompleted();
  const isOverdue = task.isOverdue();
  const TypeIcon = typeVisual.icon;



  const handleToggle = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    onToggleStatus(task.id, task.status);
  };

  const handleCardPress = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignore
    }
    onPress(task);
  };

  return (
    <Pressable
      testID={`task-card-${task.id}`}
      onPress={handleCardPress}
      className={`relative mb-2.5 rounded-2xl bg-card border border-border overflow-hidden ${className}`}
      style={({ pressed }) => [
        {
          elevation: 2,
          opacity: pressed ? 0.9 : 1,
          backgroundColor: scheme === 'dark' ? '#171717' : '#ffffff',
        },
      ]}
    >
      {/* Type colored left accent bar */}
      <View
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: typeVisual.borderColor }}
      />

      <View className="pl-4 pr-3.5 py-3.5 flex-row items-start">
        {/* Interactive Status Checkbox */}
        <Pressable
          testID={`task-checkbox-${task.id}`}
          onPress={handleToggle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className={`h-6 w-6 mt-0.5 mr-3 items-center justify-center rounded-lg border ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500'
              : task.status === 'LOST'
                ? 'bg-rose-500/10 border-rose-500'
                : 'bg-muted border-border'
          }`}
        >
          {isCompleted ? <Check size={14} color="#ffffff" strokeWidth={3} /> : null}
        </Pressable>

        {/* Content Body */}
        <View className="flex-1">
          {/* Top Badges Row */}
          <View className="flex-row items-center justify-between mb-1.5 flex-wrap gap-y-1">
            <View className="flex-row items-center space-x-1.5">
              <Badge
                variant={typeVisual.badgeVariant}
                size="sm"
                icon={<TypeIcon size={10} color={typeVisual.color} className="mr-1" />}
                label={typeVisual.label}
              />
              {task.status !== 'PENDING' && task.status !== 'COMPLETED' ? (
                <Badge variant={statusVisual.badgeVariant} size="sm" label={statusVisual.label} />
              ) : null}
              {isOverdue && !isCompleted ? (
                <View className="flex-row items-center bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                  <AlertTriangle size={10} color={activeColors.destructive} className="mr-1" />
                  <Text className="text-[10px] font-bold text-destructive">Vencida</Text>
                </View>
              ) : null}
            </View>

          </View>

          {/* Title */}
          <Text
            className={`text-sm font-bold ${
              isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {/* Metadata badges row (GPS, Photo, Value) */}
          <View className="flex-row items-center mt-1.5 space-x-3">
            {task.latitude !== null && task.longitude !== null ? (
              <View className="flex-row items-center">
                <MapPin size={11} color={activeColors.mutedForeground} className="mr-0.5" />
                <Text className="text-[10px] text-muted-foreground">GPS</Text>
              </View>
            ) : null}
            {task.photoUrl ? (
              <View className="flex-row items-center">
                <Camera size={11} color={activeColors.mutedForeground} className="mr-0.5" />
                <Text className="text-[10px] text-muted-foreground">Foto</Text>
              </View>
            ) : null}
            {task.estimatedValue !== null ? (
              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                ${task.estimatedValue.toFixed(2)}
              </Text>
            ) : null}
          </View>

          {/* Customer / Additional Metadata Row */}
          {task.customer ? (
            <View className="mt-2.5 flex-row items-center pt-2 border-t border-border/60">
              <Building2 size={12} color={activeColors.mutedForeground} className="mr-1.5" />
              <Text className="text-xs font-semibold text-foreground flex-1" numberOfLines={1}>
                {task.customer.name}
              </Text>
              {task.customer.phone ? (
                <Text className="text-[11px] text-muted-foreground ml-2">
                  {task.customer.phone}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
