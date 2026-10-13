import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePendingOperations } from '@/application/hooks/sync/use-pending-operations';
import { useSyncNow } from '@/application/hooks/sync/use-sync-now';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { OfflineBanner } from '@/presentation/components/feedback/offline-banner';
import { Card } from '@/presentation/components/ui/card';
import { SyncOperationRow } from '@/presentation/features/sync/sync-operation-row';
import { SyncPanel } from '@/presentation/features/sync/sync-panel';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

/** Sync details: state, rejected changes (retry / discard) and the queue in push order. */
export default function SyncScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { operations } = usePendingOperations();
  const { syncNow, isSyncing } = useSyncNow();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={es.sync.title} onBack={() => router.back()} />
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={() => void syncNow()}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
      >
        <SyncPanel />

        <Card className="gap-2 p-4">
          <View>
            <Text className="text-base font-semibold text-foreground">{es.sync.queueTitle}</Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {operations.length > 0 ? es.sync.queueDescription : es.sync.queueEmpty}
            </Text>
          </View>
          {operations.map((operation) => (
            <SyncOperationRow key={operation.seq} operation={operation} />
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
