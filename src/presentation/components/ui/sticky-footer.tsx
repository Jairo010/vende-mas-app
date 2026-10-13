import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface StickyFooterProps {
  children: ReactNode;
  className?: string;
}

/** Bottom action bar (cart totals, confirm buttons) that respects the home indicator. */
export function StickyFooter({ children, className = '' }: StickyFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`border-t border-border bg-card px-4 pt-3 ${className}`}
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {children}
    </View>
  );
}
