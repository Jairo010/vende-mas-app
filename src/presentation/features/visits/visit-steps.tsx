import { Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { VisitStatus } from '@/core/types/visit.types';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

const STEPS = [es.visits.steps.checkIn, es.visits.steps.work, es.visits.steps.checkOut] as const;

/** Index of the step the seller is on (STEPS.length = all done). */
function currentStep(status: VisitStatus): number {
  if (status === 'SCHEDULED') return 0;
  if (status === 'IN_PROGRESS') return 1;
  return STEPS.length;
}

/** Check-in → work → check-out progress of a visit. */
export function VisitSteps({ status }: { status: VisitStatus }) {
  const colors = useThemeColors();
  const current = currentStep(status);

  return (
    <View className="flex-row items-center" accessibilityRole="progressbar">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View
            key={label}
            className={`flex-row items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
          >
            <View className="items-center">
              <View
                className={`h-7 w-7 items-center justify-center rounded-full border ${
                  done
                    ? 'border-success bg-success'
                    : active
                      ? 'border-primary bg-primary'
                      : 'border-border bg-muted'
                }`}
              >
                {done ? (
                  <Check size={14} color={colors.successForeground} />
                ) : (
                  <Text
                    className={`text-xs font-bold ${
                      active ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                className={`mt-1 text-[11px] ${
                  active ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </Text>
            </View>
            {index < STEPS.length - 1 ? (
              <View
                className={`mx-1 mb-4 h-0.5 flex-1 rounded-full ${done ? 'bg-success' : 'bg-border'}`}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
