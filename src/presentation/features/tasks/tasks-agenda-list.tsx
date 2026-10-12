import { useMemo } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { TaskEntity } from '@/core/entities/task.entity';
import { LoadingSpinner } from '@/presentation/components/ui/loading-spinner';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import type { TaskStatus } from '@/core/types/task.types';
import { TaskEmptyState } from './task-empty-state';
import { getTypeVisual } from './task-visuals';
import { TaskCard } from './task-card';

export interface TasksAgendaListProps {
  tasks: TaskEntity[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onTaskPress: (task: TaskEntity) => void;
  onToggleStatus: (id: string, currentStatus: TaskStatus) => void;
  onCreateTask?: () => void;
  className?: string;
}

function formatTimeFromDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}

export function TasksAgendaList({
  tasks,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onTaskPress,
  onToggleStatus,
  onCreateTask,
  className = '',
}: TasksAgendaListProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const handleFabPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore
    }
    onCreateTask?.();
  };

  const handleCardPress = async (task: TaskEntity) => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignore
    }
    onTaskPress(task);
  };

  // Sort tasks by dueDate time
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aTime - bTime;
    });
  }, [tasks]);

  return (
    <View className={`flex-1 relative ${className}`}>
      <FlashList
        data={sortedTasks}
        renderItem={({ item, index }) => {
          const typeVisual = getTypeVisual(item.type || item.category);
          const time = formatTimeFromDate(item.dueDate);

          // Only show the time label if it differs from the previous task's time
          const prevTask = index > 0 ? sortedTasks[index - 1] : null;
          const prevTime = prevTask ? formatTimeFromDate(prevTask.dueDate) : null;
          const showTimeLabel = time !== prevTime;

          return (
            <View className="flex-row" style={{ paddingHorizontal: 16, marginBottom: 4 }}>
              {/* Left column: Time label */}
              <View style={{ width: 46, paddingTop: 16, alignItems: 'flex-end', paddingRight: 4 }}>
                {showTimeLabel && time ? (
                  <Text className="text-xs font-semibold text-muted-foreground">{time}</Text>
                ) : null}
              </View>

              {/* Center column: Timeline connector */}
              <View style={{ width: 24, alignItems: 'center' }}>
                {/* Connector dot */}
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: typeVisual.borderColor,
                    marginTop: 22,
                    zIndex: 2,
                  }}
                />
                {/* Vertical line */}
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: activeColors.border,
                    marginTop: 0, // dot touches line
                  }}
                />
              </View>

              {/* Right column: Task card */}
              <View style={{ flex: 1, paddingBottom: 16 }}>
                <TaskCard task={item} onPress={handleCardPress} onToggleStatus={onToggleStatus} />
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={activeColors.primary}
              colors={[activeColors.primary]}
            />
          ) : undefined
        }
        ListHeaderComponent={
          sortedTasks.length > 0 ? (
            <View className="flex-row px-4 pb-2 pt-1">
              <View style={{ width: 46, alignItems: 'flex-end', paddingRight: 4 }}>
                <Text className="text-[11px] font-bold text-muted-foreground">Hora</Text>
              </View>
              <View style={{ width: 24 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text className="text-[11px] font-bold text-muted-foreground">Tareas</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="py-16 items-center justify-center">
              <LoadingSpinner size="large" />
            </View>
          ) : (
            <TaskEmptyState isFiltered={false} onCreateTask={onCreateTask} />
          )
        }
      />

      {/* Floating Action Button (FAB) */}
      {onCreateTask ? (
        <Pressable
          testID="create-task-fab"
          onPress={handleFabPress}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-2xl bg-primary active:opacity-90"
          style={{
            elevation: 6,
          }}
        >
          <Plus size={26} color={activeColors.primaryForeground} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
}
