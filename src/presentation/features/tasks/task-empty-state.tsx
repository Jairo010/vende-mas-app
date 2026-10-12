import { CalendarX, SearchX } from 'lucide-react-native';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface TaskEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
  onCreateTask?: () => void;
  className?: string;
}

export function TaskEmptyState({
  isFiltered = false,
  onResetFilters,
  onCreateTask,
  className = '',
}: TaskEmptyStateProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  if (isFiltered) {
    return (
      <EmptyState
        testID="task-empty-filtered"
        icon={<SearchX size={32} color={activeColors.mutedForeground} />}
        title={es.tasks.empty.noResultsTitle}
        description={es.tasks.empty.noResultsDescription}
        actionLabel={es.tasks.empty.clearFilters}
        onActionPress={onResetFilters}
        className={className}
      />
    );
  }

  return (
    <EmptyState
      testID="task-empty-default"
      icon={<CalendarX size={32} color={activeColors.primary} />}
      title={es.tasks.empty.title}
      description={es.tasks.empty.description}
      actionLabel={es.tasks.empty.createFirst}
      onActionPress={onCreateTask}
      className={className}
    />
  );
}
