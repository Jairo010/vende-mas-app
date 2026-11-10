import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { hasValidVisitNotes } from '@/core/types/visit.types';
import { BottomSheet } from '@/presentation/components/ui/bottom-sheet';
import { Button } from '@/presentation/components/ui/button';
import { es } from '@/shared/i18n/es';
import { todayKey, zonedInstant } from '@/shared/utils/date';
import { FONT_FAMILY, useThemeColors } from '@/theme';
import { OptionalTimeField } from './optional-time-field';

const MAX_NOTES_LENGTH = 500;
const SUGGESTED_TIME = '15:00';

export interface PostponeVisitSheetProps {
  open: boolean;
  onClose: () => void;
  /** `returnAt`: ISO instant the customer mentioned, if any. */
  onConfirm: (notes: string, returnAt?: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

/**
 * The customer is busy: the visit goes last on today's route. The time is only a reminder of what
 * the customer said, so the route never depends on it.
 */
export function PostponeVisitSheet({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: PostponeVisitSheetProps) {
  const colors = useThemeColors();
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (open) {
      setNotes('');
      setTime(null);
      setShowErrors(false);
    }
  }, [open]);

  const notesAreValid = hasValidVisitNotes(notes);

  const confirm = () => {
    setShowErrors(true);
    if (!notesAreValid) return;
    const returnAt = time === null ? undefined : zonedInstant(todayKey(), time).toISOString();
    void onConfirm(notes.trim(), returnAt);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={es.visits.postpone.title}
      description={es.visits.postpone.description}
    >
      <View className="gap-3">
        {/* Inside a sheet the keyboard handling needs gorhom's input, styled from the theme. */}
        <BottomSheetTextInput
          testID="postpone-visit-notes"
          value={notes}
          onChangeText={setNotes}
          placeholder={es.visits.postpone.notesPlaceholder}
          placeholderTextColor={colors.mutedForeground}
          maxLength={MAX_NOTES_LENGTH}
          multiline
          style={{
            minHeight: 88,
            borderWidth: 1,
            borderColor: showErrors && !notesAreValid ? colors.destructive : colors.border,
            borderRadius: 12,
            backgroundColor: colors.background,
            color: colors.foreground,
            fontFamily: FONT_FAMILY,
            fontSize: 15,
            paddingHorizontal: 14,
            paddingVertical: 12,
            textAlignVertical: 'top',
          }}
        />
        {showErrors && !notesAreValid ? (
          <Text className="text-xs font-medium text-destructive">
            {es.visits.validation.notesRequired}
          </Text>
        ) : null}
        <OptionalTimeField
          testID="postpone-visit-time"
          value={time}
          suggestedTime={SUGGESTED_TIME}
          onChange={setTime}
        />
        <Button testID="postpone-visit-confirm" isLoading={isSubmitting} onPress={confirm}>
          {es.visits.postpone.confirm}
        </Button>
        <Button variant="ghost" onPress={onClose}>
          {es.visits.cancel.keep}
        </Button>
      </View>
    </BottomSheet>
  );
}
