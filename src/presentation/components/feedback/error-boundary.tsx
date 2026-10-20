import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Called with the error (e.g. to report it). */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const colors = useThemeColors();
  return (
    <View
      testID="error-boundary-fallback"
      className="flex-1 items-center justify-center bg-background"
    >
      <EmptyState
        icon={<AlertTriangle size={32} color={colors.destructive} />}
        title={es.errors.boundaryTitle}
        description={es.errors.boundaryDescription}
        actionLabel={es.common.retry}
        onActionPress={onRetry}
      />
    </View>
  );
}

/** Keeps a rendering error in one screen from closing the whole app. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  private readonly reset = () => this.setState({ error: null });

  public render(): ReactNode {
    if (this.state.error) return <ErrorFallback onRetry={this.reset} />;
    return this.props.children;
  }
}
