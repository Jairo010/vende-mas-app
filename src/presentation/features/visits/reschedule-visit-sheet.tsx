import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { VisitEntity } from '@/core/entities/visit.entity';
import { BottomSheet } from '@/presentation/components/ui/bottom-sheet';
import { Button } from '@/presentation/components/ui/button';
import {
  DatePickerField,
  TimePickerField,
} from '@/presentation/components/ui/date-time-picker-field';
import { es } from '@/shared/i18n/es';
import { todayKey, toDateKey, toLocalTime, zonedInstant } from '@/shared/utils/date';

export interface RescheduleVisitSheetProps {
  visit: VisitEntity;
  open: boolean;
  onClose: () => void;
  /** Receives the new ISO instant. */
  onConfirm: (scheduledAt: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

/** Moves a scheduled visit to another local date and time. */
export function RescheduleVisitSheet({
  visit,
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: RescheduleVisitSheetProps) {
  const [date, setDate] = useState(() => toDateKey(visit.scheduledAt));
  const [time, setTime] = useState(() => toLocalTime(visit.scheduledAt));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(toDateKey(visit.scheduledAt));
    setTime(toLocalTime(visit.scheduledAt));
    setError(null);
  }, [open, visit.scheduledAt]);

  const confirm = () => {
    const instant = zonedInstant(date, time);
    if (instant.getTime() <= Date.now()) {
      setError(es.newVisit.pastDateError);
      return;
    }
    void onConfirm(instant.toISOString());
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
        <TimePickerField
          testID="reschedule-time"
          label={es.newVisit.time}
          value={time}
          onChange={(value) => {
            setTime(value);
            setError(null);
          }}
        />
        {error ? <Text className="text-xs font-medium text-destructive">{error}</Text> : null}
        <Button testID="reschedule-confirm" isLoading={isSubmitting} onPress={confirm}>
          {es.visits.reschedule.confirm}
        </Button>
      </View>
    </BottomSheet>
  );
}
