import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Search, X, Filter } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { TaskCategory, TaskStatus, TaskType } from '@/core/types/task.types';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';
import { getTypeVisual } from './task-visuals';

export interface TasksFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  selectedCategory: TaskType | TaskCategory | 'ALL';
  onCategoryChange: (category: TaskType | TaskCategory | 'ALL') => void;
  selectedStatus: TaskStatus | 'ALL';
  onStatusChange: (status: TaskStatus | 'ALL') => void;
  onResetFilters: () => void;
  className?: string;
}

const TYPE_FILTERS: Array<{ key: TaskType | 'ALL'; label: string }> = [
  { key: 'ALL', label: es.tasks.allTypes },
  { key: 'OPPORTUNITY', label: 'Oportunidades' },
  { key: 'VISIT', label: 'Visitas' },
  { key: 'SALE', label: 'Ventas' },
  { key: 'COLLECTION', label: 'Cobranzas' },
];

const STATUS_FILTERS: Array<{ key: TaskStatus | 'ALL'; label: string }> = [
  { key: 'ALL', label: es.tasks.allStatuses },
  { key: 'PENDING', label: es.tasks.statuses.PENDING },
  { key: 'IN_PROGRESS', label: es.tasks.statuses.IN_PROGRESS },
  { key: 'COMPLETED', label: es.tasks.statuses.COMPLETED },
  { key: 'LOST', label: es.tasks.statuses.LOST },
  { key: 'COLLECTED', label: es.tasks.statuses.COLLECTED },
];

export function TasksFilterBar({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  onResetFilters,
  className = '',
}: TasksFilterBarProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const hasActiveFilters =
    Boolean(search.trim()) || selectedCategory !== 'ALL' || selectedStatus !== 'ALL';

  const handleCategoryPress = async (cat: TaskType | TaskCategory | 'ALL') => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignore
    }
    onCategoryChange(cat);
  };

  const handleStatusPress = async (status: TaskStatus | 'ALL') => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignore
    }
    onStatusChange(status);
  };

  const handleClearSearch = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    onSearchChange('');
  };

  return (
    <View className={`bg-card px-4 pt-3 pb-3 border-b border-border ${className}`}>
      {/* Search Input Bar */}
      <View className="flex-row items-center rounded-xl bg-muted px-3 py-2 border border-border">
        <Search size={16} color={activeColors.mutedForeground} className="mr-2" />
        <TextInput
          testID="tasks-search-input"
          value={search}
          onChangeText={onSearchChange}
          placeholder={es.tasks.searchPlaceholder}
          placeholderTextColor={activeColors.mutedForeground}
          className="flex-1 text-sm text-foreground p-0"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <Pressable
            testID="tasks-clear-search-button"
            onPress={handleClearSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="p-1 rounded-full bg-border"
          >
            <X size={12} color={activeColors.foreground} />
          </Pressable>
        ) : null}
      </View>

      {/* Type Pills (Horizontal Scroll) */}
      <View className="mt-2.5">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {TYPE_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const visual = cat.key !== 'ALL' ? getTypeVisual(cat.key) : null;

            return (
              <Pressable
                key={cat.key}
                testID={`filter-category-${cat.key}`}
                onPress={() => handleCategoryPress(cat.key)}
                className={`flex-row items-center rounded-full px-3 py-1.5 mr-2 border ${
                  isSelected ? 'bg-primary border-primary' : 'bg-muted/60 border-border'
                }`}
              >
                {visual && (
                  <View
                    className="h-2 w-2 rounded-full mr-1.5"
                    style={{
                      backgroundColor: isSelected ? '#ffffff' : visual.color,
                    }}
                  />
                )}
                <Text
                  className={`text-xs font-medium ${
                    isSelected ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Status Pills & Clear Filters Row */}
      <View className="mt-2 flex-row items-center justify-between">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {STATUS_FILTERS.map((st) => {
            const isSelected = selectedStatus === st.key;

            return (
              <Pressable
                key={st.key}
                testID={`filter-status-${st.key}`}
                onPress={() => handleStatusPress(st.key)}
                className={`rounded-lg px-2.5 py-1 mr-1.5 border ${
                  isSelected ? 'bg-foreground border-foreground' : 'bg-muted/40 border-border'
                }`}
              >
                <Text
                  className={`text-[11px] font-medium ${
                    isSelected ? 'text-background font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {st.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {hasActiveFilters ? (
          <Pressable
            testID="tasks-reset-filters-button"
            onPress={onResetFilters}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="flex-row items-center ml-2 px-2 py-1 rounded-md bg-destructive/10"
          >
            <Filter size={11} color={activeColors.destructive} className="mr-1" />
            <Text className="text-[11px] font-bold text-destructive">Limpiar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
