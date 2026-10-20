import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/theme';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Omit to size the sheet to its content. */
  snapPoints?: (string | number)[];
  children: ReactNode;
  testID?: string;
}

/**
 * Themed sheet over @gorhom/bottom-sheet (replaces the copied `Modal` sheets). Controlled
 * with `open` / `onClose`; requires `BottomSheetModalProvider` (in AppProviders).
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  snapPoints,
  children,
  testID,
}: BottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (open) ref.current?.present();
    else ref.current?.dismiss();
  }, [open]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.mutedForeground, width: 40 }}
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView
        testID={testID}
        style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      >
        {title ? (
          <View className="mb-4">
            <Text className="text-lg font-bold text-foreground">{title}</Text>
            {description ? (
              <Text className="mt-1 text-sm text-muted-foreground">{description}</Text>
            ) : null}
          </View>
        ) : null}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
