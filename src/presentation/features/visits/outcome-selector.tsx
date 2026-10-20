import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CircleCheck, Circle } from 'lucide-react-native';
import type { VisitOutcome } from '@/core/types/visit.types';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

export interface OutcomeSelectorProps {
  outcomes: readonly VisitOutcome[];
  value: VisitOutcome | null;
  onChange: (outcome: VisitOutcome) => void;
  error?: string;
}

/** Outcome of the visit (only the ones that apply to its type). */
export function OutcomeSelector({ outcomes, value, onChange, error }: OutcomeSelectorProps) {
  const colors = useThemeColors();

  return (
    <View>
      <Text className="mb-3 text-base font-semibold text-foreground">
        {es.visits.outcome.title}
      </Text>
      <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
        {outcomes.map((outcome) => {
          const selected = outcome === value;
          const Icon = selected ? CircleCheck : Circle;
          return (
            <Pressable
              key={outcome}
              testID={`visit-outcome-${outcome}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(outcome);
              }}
              className={`min-w-[47%] flex-1 flex-row items-center rounded-xl border px-3 py-3 ${
                selected ? 'border-primary bg-primary/10' : 'border-border bg-card active:bg-muted'
              }`}
            >
              <Icon size={18} color={selected ? colors.primary : colors.mutedForeground} />
              <Text
                className={`ml-2 flex-1 text-sm ${
                  selected ? 'font-semibold text-foreground' : 'text-foreground'
                }`}
              >
                {es.visits.outcomes[outcome]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="mt-2 text-xs font-medium text-destructive">{error}</Text> : null}
    </View>
  );
}
