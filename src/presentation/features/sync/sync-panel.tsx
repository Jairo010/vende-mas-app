import { Text, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { useRejectedOperations } from '@/application/hooks/sync/use-rejected-operations';
import { useSyncNow } from '@/application/hooks/sync/use-sync-now';
import { useSyncStatus } from '@/application/hooks/sync/use-sync-status';
import { SyncStatusPill } from '@/presentation/components/feedback/sync-status-pill';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { es } from '@/shared/i18n/es';
import { formatDateTime } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';

/** Sync summary for "Más": state, pending changes, rejected ones and a manual trigger. */
export function SyncPanel() {
  const colors = useThemeColors();
  const { pendingCount, lastSyncedAt, lastError } = useSyncStatus();
  const { syncNow, isSyncing } = useSyncNow();
  const { operations: rejected, discard, isDiscarding } = useRejectedOperations();

  const errorMessage =
    lastError && lastError in es.sync.errors
      ? es.sync.errors[lastError as keyof typeof es.sync.errors]
      : null;

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
        <View className="mt-4">
          <Text className="text-sm font-semibold text-destructive">{es.sync.rejectedTitle}</Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {es.sync.rejectedDescription}
          </Text>
          {rejected.map((operation) => (
            <View
              key={operation.seq}
              testID={`rejected-operation-${operation.seq}`}
              className="mt-2 flex-row items-center rounded-xl border border-destructive/30 bg-destructive/10 p-3"
            >
              <View className="flex-1 pr-2">
                <Text className="text-sm font-medium text-foreground">
                  {es.sync.entities[operation.entityType]} · {operation.action}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {operation.lastError?.message ?? operation.lastError?.code}
                </Text>
              </View>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDiscarding}
                onPress={() => void discard(operation.seq)}
              >
                {es.sync.discard}
              </Button>
            </View>
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
    </Card>
  );
}
