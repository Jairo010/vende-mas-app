import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { BottomSheet } from '@/presentation/components/ui/bottom-sheet';
import { Button } from '@/presentation/components/ui/button';
import { es } from '@/shared/i18n/es';
import { FONT_FAMILY, useThemeColors } from '@/theme';

const MAX_REASON_LENGTH = 500;

export interface CancelVisitSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string | undefined) => Promise<void> | void;
  isSubmitting?: boolean;
}

/** Confirms the cancellation with an optional reason. */
export function CancelVisitSheet({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: CancelVisitSheetProps) {
  const colors = useThemeColors();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={es.visits.cancel.title}
      description={es.visits.cancel.description}
    >
      <View className="gap-3">
        {/* Inside a sheet the keyboard handling needs gorhom's input, styled from the theme. */}
        <BottomSheetTextInput
          testID="cancel-visit-reason"
          value={reason}
          onChangeText={setReason}
          placeholder={es.visits.cancel.reasonPlaceholder}
          placeholderTextColor={colors.mutedForeground}
          maxLength={MAX_REASON_LENGTH}
          multiline
          style={{
            minHeight: 88,
            borderWidth: 1,
            borderColor: colors.border,
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
        <Button
          testID="cancel-visit-confirm"
          variant="destructive"
          isLoading={isSubmitting}
          onPress={() => void onConfirm(reason.trim() || undefined)}
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
