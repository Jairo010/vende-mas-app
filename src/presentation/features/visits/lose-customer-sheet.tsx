import { View } from 'react-native';
import { BottomSheet } from '@/presentation/components/ui/bottom-sheet';
import { Button } from '@/presentation/components/ui/button';
import { es } from '@/shared/i18n/es';

export interface LoseCustomerSheetProps {
  open: boolean;
  /** A prospect "rejected"; an active customer "ended the relationship". */
  isProspect: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isSubmitting?: boolean;
}

/**
 * "Not interested" finishes the visit without a next one and takes the customer off the routes
 * (API ADR 0038): one wrong tap would lose it, so the seller confirms.
 */
export function LoseCustomerSheet({
  open,
  isProspect,
  onClose,
  onConfirm,
  isSubmitting = false,
}: LoseCustomerSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={es.visits.lose.title}
      description={es.visits.lose.description(isProspect)}
    >
      <View className="gap-3">
        <Button
          testID="lose-customer-confirm"
          variant="destructive"
          isLoading={isSubmitting}
          onPress={() => void onConfirm()}
        >
          {es.visits.lose.confirm}
        </Button>
        <Button variant="ghost" onPress={onClose}>
          {es.visits.lose.keep}
        </Button>
      </View>
    </BottomSheet>
  );
}
