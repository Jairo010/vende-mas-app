import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import {
  CANCELLATION_FAILURE_REASONS,
  hasValidVisitNotes,
  type VisitFailureReason,
} from '@/core/types/visit.types';
import { BottomSheet } from '@/presentation/components/ui/bottom-sheet';
import { Button } from '@/presentation/components/ui/button';
import { es } from '@/shared/i18n/es';
import { FONT_FAMILY, useThemeColors } from '@/theme';
import { FailureReasonSelector } from './failure-reason-selector';

const MAX_REASON_LENGTH = 500;

export interface CancelVisitSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (failureReason: VisitFailureReason, notes: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

/** Confirms the cancellation: why, from the fixed list, and what happened, in words. */
export function CancelVisitSheet({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: CancelVisitSheetProps) {
  const colors = useThemeColors();
  const [failureReason, setFailureReason] = useState<VisitFailureReason | null>(null);
  const [notes, setNotes] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (open) {
      setFailureReason(null);
      setNotes('');
      setShowErrors(false);
    }
  }, [open]);

  const notesAreValid = hasValidVisitNotes(notes);

  const confirm = () => {
    setShowErrors(true);
    if (failureReason && notesAreValid) void onConfirm(failureReason, notes.trim());
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={es.visits.cancel.title}
      description={es.visits.cancel.description}
    >
      <View className="gap-3">
        <FailureReasonSelector
          reasons={CANCELLATION_FAILURE_REASONS}
          value={failureReason}
          onChange={setFailureReason}
          error={showErrors && !failureReason ? es.visits.validation.reasonRequired : undefined}
        />
        {/* Inside a sheet the keyboard handling needs gorhom's input, styled from the theme. */}
        <BottomSheetTextInput
          testID="cancel-visit-reason"
          value={notes}
          onChangeText={setNotes}
          placeholder={es.visits.cancel.reasonPlaceholder}
          placeholderTextColor={colors.mutedForeground}
          maxLength={MAX_REASON_LENGTH}
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
        <Button
          testID="cancel-visit-confirm"
          variant="destructive"
          isLoading={isSubmitting}
          onPress={confirm}
        >
          {es.visits.cancel.confirm}
        </Button>
        <Button variant="ghost" onPress={onClose}>
          {es.visits.cancel.keep}
        </Button>
      </View>
    </BottomSheet>
  );
}
