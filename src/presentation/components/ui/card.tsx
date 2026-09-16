import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View className={`rounded-2xl border border-border bg-card p-6 ${className}`} {...props}>
      {children}
    </View>
  );
}
