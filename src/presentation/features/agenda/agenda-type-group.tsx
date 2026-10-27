import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { VisitType } from '@/core/types/visit.types';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';
import { VISIT_TYPE_VISUALS } from '../visits/visit-visuals';
import type { AgendaGroup } from './agenda-groups';

export interface AgendaTypeGroupProps {
  group: AgendaGroup;
  expanded: boolean;
  onToggle: (type: VisitType) => void;
  /** The group's visits, rendered only while it is expanded. */
  children: ReactNode;
}

/** Collapsible parent of the agenda: one per visit type, with how many visits are done. */
export function AgendaTypeGroup({ group, expanded, onToggle, children }: AgendaTypeGroupProps) {
  const colors = useThemeColors();
  const visual = VISIT_TYPE_VISUALS[group.type];
  const TypeIcon = visual.icon;
  const Chevron = expanded ? ChevronUp : ChevronDown;
  const total = group.visits.length;

  return (
    <View className="gap-3">
      <Pressable
        testID={`agenda-group-${group.type}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityHint={expanded ? es.agenda.collapseGroup : es.agenda.expandGroup}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onToggle(group.type);
        }}
        className={`flex-row items-center rounded-2xl border border-border border-l-4 bg-card px-4 py-3.5 active:opacity-80 ${visual.borderClass}`}
      >
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <TypeIcon size={20} color={colors[visual.token]} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-foreground">
            {es.agenda.groups[group.type]}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {es.agenda.groupProgress(group.done, total)}
          </Text>
        </View>
        <View className="mr-3 items-center rounded-full bg-muted px-2.5 py-0.5">
          <Text className="text-sm font-bold text-foreground">{total}</Text>
        </View>
        <Chevron size={20} color={colors.mutedForeground} />
      </Pressable>

      {expanded ? <View className="gap-3 pl-3">{children}</View> : null}
    </View>
  );
}
