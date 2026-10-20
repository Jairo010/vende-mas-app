import { Text, View } from 'react-native';
import type { OutboxOperation } from '@/core/types/sync.types';
import { Button } from '@/presentation/components/ui/button';
import { es } from '@/shared/i18n/es';
import { formatDateTime } from '@/shared/utils/date';

export interface SyncOperationRowProps {
  operation: OutboxOperation;
  /** Rejected operations: send again (after fixing the cause) or dismiss. */
  onRetry?: (seq: number) => void;
  onDiscard?: (seq: number) => void;
  disabled?: boolean;
}

/** One queued change: what, when, attempts and the last error. */
export function SyncOperationRow({
  operation,
  onRetry,
  onDiscard,
  disabled = false,
}: SyncOperationRowProps) {
  const rejected = operation.status === 'REJECTED';
  const error = operation.lastError?.message ?? operation.lastError?.code;

  return (
    <View
      testID={`sync-operation-${operation.seq}`}
      className={`rounded-xl border p-3 ${
        rejected ? 'border-destructive/30 bg-destructive/10' : 'border-border bg-card'
      }`}
    >
      <Text className="text-sm font-medium text-foreground">
        {es.sync.entities[operation.entityType]} · {es.sync.actions[operation.action]}
      </Text>
      <Text className="mt-0.5 text-xs text-muted-foreground">
        {formatDateTime(operation.createdAt)}
        {operation.attempts > 0 ? ` · ${operation.attempts} ${es.sync.attempts}` : ''}
      </Text>
      {error ? (
        <Text className={`mt-1 text-xs ${rejected ? 'text-destructive' : 'text-warning'}`}>
          {error}
        </Text>
      ) : null}

      {onRetry || onDiscard ? (
        <View className="mt-2 flex-row justify-end gap-2">
          {onDiscard ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              textClassName="text-destructive"
              onPress={() => onDiscard(operation.seq)}
            >
              {es.sync.discard}
            </Button>
          ) : null}
          {onRetry ? (
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onPress={() => onRetry(operation.seq)}
            >
              {es.sync.retry}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
