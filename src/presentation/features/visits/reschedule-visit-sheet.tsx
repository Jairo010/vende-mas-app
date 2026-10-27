import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { BottomSheet } from '@/presentation/components/ui/bottom-sheet';
import { Button } from '@/presentation/components/ui/button';
import { DatePickerField } from '@/presentation/components/ui/date-time-picker-field';
import { es } from '@/shared/i18n/es';
import { todayKey, toDateKey, toLocalTime, zonedInstant } from '@/shared/utils/date';
import { OptionalTimeField } from './optional-time-field';

const DEFAULT_TIME = '09:00';

/** The visit's agreed time, or `null` when it is planned for the day only. */
const timeOf = (visit: VisitEntity): string | null =>
  visit.hasScheduledTime ? toLocalTime(visit.scheduledAt) : null;

export interface RescheduleVisitSheetProps {
  visit: VisitEntity;
  open: boolean;
  onClose: () => void;
  /** Receives the new ISO instant (local midnight when there is no agreed time). */
  onConfirm: (scheduledAt: string, hasScheduledTime: boolean) => Promise<void> | void;
  isSubmitting?: boolean;
}

/** Moves a scheduled visit to another local date, with or without an agreed time. */
export function RescheduleVisitSheet({
  visit,
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: RescheduleVisitSheetProps) {
  const [date, setDate] = useState(() => toDateKey(visit.scheduledAt));
  const [time, setTime] = useState<string | null>(() => timeOf(visit));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(toDateKey(visit.scheduledAt));
    setTime(timeOf(visit));
    setError(null);
  }, [open, visit.scheduledAt, visit.hasScheduledTime]);

  const confirm = () => {
    if (time === null && date < todayKey()) {
      setError(es.newVisit.pastDayError);
      return;
    }
    const instant = zonedInstant(date, time ?? '00:00');
    if (time !== null && instant.getTime() <= Date.now()) {
      setError(es.newVisit.pastDateError);
      return;
    }
    void onConfirm(instant.toISOString(), time !== null);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={es.visits.reschedule.title}>
      <View className="gap-4">
        <DatePickerField
          testID="reschedule-date"
          label={es.newVisit.date}
          value={date}
          minDate={todayKey()}
          onChange={(value) => {
            setDate(value);
            setError(null);
          }}
        />
        <OptionalTimeField
          testID="reschedule-time"
          value={time}
          suggestedTime={timeOf(visit) ?? DEFAULT_TIME}
          onChange={(value) => {
            setTime(value);
            setError(null);
          }}
          error={error}
        />
        <Button testID="reschedule-confirm" isLoading={isSubmitting} onPress={confirm}>
          {es.visits.reschedule.confirm}
        </Button>
      </View>
    </BottomSheet>
  );
}
