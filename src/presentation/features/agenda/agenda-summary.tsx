import { Text, View } from 'react-native';
import { es } from '@/shared/i18n/es';
import type { DaySummary } from './agenda-marks';

interface TileProps {
  label: string;
  value: number;
  /** Text color class built from a palette token. */
  valueClass: string;
  testID: string;
}

function Tile({ label, value, valueClass, testID }: TileProps) {
  return (
    <View testID={testID} className="flex-1 rounded-2xl border border-border bg-card px-3 py-2.5">
      <Text className={`text-xl font-bold ${valueClass}`}>{value}</Text>
      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Scheduled / in progress / completed counts of the selected day. */
export function AgendaSummary({ summary }: { summary: DaySummary }) {
  return (
    <View className="flex-row gap-2">
      <Tile
        testID="agenda-summary-scheduled"
        label={es.agenda.summary.scheduled}
        value={summary.scheduled}
        valueClass="text-status-scheduled"
      />
      <Tile
        testID="agenda-summary-in-progress"
        label={es.agenda.summary.inProgress}
        value={summary.inProgress}
        valueClass="text-status-in-progress"
      />
      <Tile
        testID="agenda-summary-completed"
        label={es.agenda.summary.completed}
        value={summary.completed}
        valueClass="text-status-completed"
      />
    </View>
  );
}
