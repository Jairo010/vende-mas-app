import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaLayoutProps {
  children: ReactNode;
  style?: ViewStyle;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}

export function SafeAreaLayout({
  children,
  style,
  edges = ['top', 'right', 'bottom', 'left'],
}: SafeAreaLayoutProps) {
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View className="flex-1 bg-background" style={[paddingStyle, style]}>
      {children}
    </View>
  );
}
