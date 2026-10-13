import { Text, View } from 'react-native';
import { es } from '@/shared/i18n/es';

export interface DetailRowProps {
  label: string;
  value: string | null | undefined;
  /** Hides the bottom divider (last row of a card). */
  isLast?: boolean;
}

/** Label / value line of a detail card. */
export function DetailRow({ label, value, isLast = false }: DetailRowProps) {
  return (
    <View className={`flex-row justify-between py-2.5 ${isLast ? '' : 'border-b border-border'}`}>
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-sm font-medium text-foreground">
        {value || es.common.notAvailable}
      </Text>
    </View>
  );
}
