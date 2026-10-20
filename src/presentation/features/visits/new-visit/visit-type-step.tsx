import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CircleCheck } from 'lucide-react-native';
import { VISIT_TYPES, type VisitType } from '@/core/types/visit.types';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';
import { VISIT_TYPE_VISUALS } from '../visit-visuals';

export interface VisitTypeStepProps {
  value: VisitType | null;
  onChange: (type: VisitType) => void;
}

/** Step 1: opportunity, order or collection. */
export function VisitTypeStep({ value, onChange }: VisitTypeStepProps) {
  const colors = useThemeColors();

  return (
    <View className="gap-3" accessibilityRole="radiogroup">
      {VISIT_TYPES.map((type) => {
        const visual = VISIT_TYPE_VISUALS[type];
        const Icon = visual.icon;
        const selected = value === type;
        return (
          <Pressable
            key={type}
            testID={`new-visit-type-${type}`}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(type);
            }}
            className={`flex-row items-center rounded-2xl border bg-card p-4 active:opacity-80 ${
              selected ? 'border-primary' : 'border-border'
            }`}
            style={selected ? { borderWidth: 2 } : undefined}
          >
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Icon size={22} color={colors[visual.token]} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-foreground">{visual.label}</Text>
              <Text className="mt-0.5 text-sm text-muted-foreground">
                {es.newVisit.typeDescriptions[type]}
              </Text>
            </View>
            {selected ? <CircleCheck size={22} color={colors.primary} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
