import { Text, View } from 'react-native';
import { ListOrdered, RefreshCw } from 'lucide-react-native';
import { useRejectedOperations } from '@/application/hooks/sync/use-rejected-operations';
import { useSyncNow } from '@/application/hooks/sync/use-sync-now';
import { useSyncStatus } from '@/application/hooks/sync/use-sync-status';
import { SyncStatusPill } from '@/presentation/components/feedback/sync-status-pill';
import { notify } from '@/presentation/components/feedback/toast';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { es } from '@/shared/i18n/es';
import { formatDateTime } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';
import { SyncOperationRow } from './sync-operation-row';

export interface SyncPanelProps {
  /** Shows the "Ver cola de envío" button (the full queue lives in its own screen). */
  onOpenQueue?: () => void;
}

/** Sync summary: state, pending changes, rejected ones (retry / discard) and a manual run. */
export function SyncPanel({ onOpenQueue }: SyncPanelProps) {
  const colors = useThemeColors();
  const { pendingCount, lastSyncedAt, lastError } = useSyncStatus();
  const { syncNow, isSyncing } = useSyncNow();
  const {
    operations: rejected,
    discard,
    isDiscarding,
    requeue,
    isRequeueing,
  } = useRejectedOperations();

  const errorMessage =
    lastError && lastError in es.sync.errors
      ? es.sync.errors[lastError as keyof typeof es.sync.errors]
      : null;

  const retry = async (seq: number) => {
    try {
      await requeue(seq);
      notify.success(es.sync.requeued);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Card className="p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-foreground">{es.sync.title}</Text>
        <SyncStatusPill />
      </View>

      <View className="mt-3 gap-1">
        <Text className="text-sm text-muted-foreground">
          {es.sync.lastSync}:{' '}
          <Text className="font-medium text-foreground">
            {lastSyncedAt ? formatDateTime(lastSyncedAt) : es.sync.never}
          </Text>
        </Text>
        <Text className="text-sm text-muted-foreground">
          {es.sync.pendingChanges}:{' '}
          <Text className="font-medium text-foreground">{pendingCount}</Text>
        </Text>
        {errorMessage ? <Text className="text-sm text-destructive">{errorMessage}</Text> : null}
      </View>

      {rejected.length > 0 ? (
        <View className="mt-4 gap-2">
          <View>
            <Text className="text-sm font-semibold text-destructive">{es.sync.rejectedTitle}</Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {es.sync.rejectedDescription}
            </Text>
          </View>
          {rejected.map((operation) => (
            <SyncOperationRow
              key={operation.seq}
              operation={operation}
              disabled={isDiscarding || isRequeueing}
              onRetry={(seq) => void retry(seq)}
              onDiscard={(seq) => void discard(seq)}
            />
          ))}
        </View>
      ) : null}

      <Button
        testID="sync-now-button"
        className="mt-4"
        variant="outline"
        isLoading={isSyncing}
        leftIcon={<RefreshCw size={16} color={colors.foreground} />}
        onPress={() => void syncNow()}
      >
        {isSyncing ? es.sync.syncing : es.sync.syncNow}
      </Button>

      {onOpenQueue ? (
        <Button
          testID="sync-open-queue"
          className="mt-2"
          variant="ghost"
          leftIcon={<ListOrdered size={16} color={colors.foreground} />}
          onPress={onOpenQueue}
        >
          {es.sync.viewDetails}
        </Button>
      ) : null}
    </Card>
  );
}
