import { ActivityIndicator, Pressable, Text } from 'react-native';
import { AlertTriangle, CheckCircle2, CloudUpload, WifiOff } from 'lucide-react-native';
import { useSyncStatus, type SyncIndicator } from '@/application/hooks/sync/use-sync-status';
import { es } from '@/shared/i18n/es';
import { useThemeColors, type ThemeToken } from '@/theme';

const PILL_STYLES: Record<SyncIndicator, { container: string; text: string; token: ThemeToken }> = {
  offline: {
    container: 'bg-muted border-border',
    text: 'text-muted-foreground',
    token: 'mutedForeground',
  },
  syncing: { container: 'bg-info/10 border-info/30', text: 'text-info', token: 'info' },
  error: {
    container: 'bg-destructive/10 border-destructive/30',
    text: 'text-destructive',
    token: 'destructive',
  },
  pending: { container: 'bg-warning/10 border-warning/30', text: 'text-warning', token: 'warning' },
  synced: { container: 'bg-success/10 border-success/30', text: 'text-success', token: 'success' },
};

export interface SyncStatusPillProps {
  onPress?: () => void;
}

/** Compact sync state for headers: offline / syncing / N pending / needs review / up to date. */
export function SyncStatusPill({ onPress }: SyncStatusPillProps) {
  const { indicator, pendingCount } = useSyncStatus();
  const colors = useThemeColors();
  const style = PILL_STYLES[indicator];
  const color = colors[style.token];

  const icon =
    indicator === 'syncing' ? (
      <ActivityIndicator size="small" color={color} />
    ) : indicator === 'offline' ? (
      <WifiOff size={14} color={color} />
    ) : indicator === 'error' ? (
      <AlertTriangle size={14} color={color} />
    ) : indicator === 'pending' ? (
      <CloudUpload size={14} color={color} />
    ) : (
      <CheckCircle2 size={14} color={color} />
    );

  const label =
    indicator === 'pending' && pendingCount > 0
      ? `${pendingCount} ${es.sync.indicator.pending.toLowerCase()}`
      : es.sync.indicator[indicator];

  return (
    <Pressable
      testID="sync-status-pill"
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={onPress}
      className={`flex-row items-center rounded-full border px-2.5 py-1 ${style.container}`}
    >
      {icon}
      <Text className={`ml-1.5 text-xs font-semibold ${style.text}`}>{label}</Text>
    </Pressable>
  );
}
