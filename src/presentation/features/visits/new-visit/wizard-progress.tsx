import { Text, View } from 'react-native';
import { es } from '@/shared/i18n/es';

export interface WizardProgressProps {
  step: number;
  total: number;
  title: string;
}

/** "Paso 2 de 3" with a segmented bar and the question of the step. */
export function WizardProgress({ step, total, title }: WizardProgressProps) {
  return (
    <View className="gap-2">
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </View>
      <Text className="text-xs font-medium text-muted-foreground">
        {es.newVisit.stepLabel} {step + 1} {es.newVisit.stepOf} {total}
      </Text>
      <Text className="text-xl font-bold text-foreground">{title}</Text>
    </View>
  );
}
