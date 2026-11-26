import { Text, View } from 'react-native';
import { es } from '@/shared/i18n/es';
import type { DaySummary } from './agenda-marks';

interface CountProps {
  label: string;
  value: number;
  /** Background class of the mark, built from a palette token. */
  dotClass: string;
  testID: string;
}

function Count({ label, value, dotClass, testID }: CountProps) {
  return (
    <View testID={testID} className="flex-row items-center">
      <View className={`mr-1.5 h-2 w-2 rounded-full ${dotClass}`} />
      <Text className="text-xs text-muted-foreground">
        <Text className="font-semibold text-foreground">{value}</Text> {label}
      </Text>
    </View>
  );
}

/**
 * How the selected day is going: visits done out of the day's total as a bar, and the count of
 * each status under it. Nothing is shown for a day without visits.
 */
export function AgendaSummary({ summary }: { summary: DaySummary }) {
  const total = summary.scheduled + summary.inProgress + summary.completed;
  if (total === 0) return null;
  const percent = Math.round((summary.completed / total) * 100);

  return (
    <View testID="agenda-summary" className="rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-xs font-medium text-muted-foreground">
            {es.agenda.dayProgressTitle}
          </Text>
          <Text testID="agenda-summary-progress" className="text-xl font-bold text-foreground">
            {es.agenda.dayProgress(summary.completed, total)}
          </Text>
        </View>
        <Text className="text-sm font-semibold text-status-completed">{percent}%</Text>
      </View>

      <View className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <View className="h-2 rounded-full bg-status-completed" style={{ width: `${percent}%` }} />
      </View>

      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
        <Count
          testID="agenda-summary-scheduled"
          label={es.agenda.summary.scheduled.toLowerCase()}
          value={summary.scheduled}
          dotClass="bg-status-scheduled"
        />
        <Count
          testID="agenda-summary-in-progress"
          label={es.agenda.summary.inProgress.toLowerCase()}
          value={summary.inProgress}
          dotClass="bg-status-in-progress"
        />
        <Count
          testID="agenda-summary-completed"
          label={es.agenda.summary.completed.toLowerCase()}
          value={summary.completed}
          dotClass="bg-status-completed"
        />
      </View>
    </View>
  );
}
