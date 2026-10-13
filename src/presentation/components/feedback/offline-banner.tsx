import { Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { WifiOff } from 'lucide-react-native';
import { useSyncStatus } from '@/application/hooks/sync/use-sync-status';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

/** Reassures the seller that working offline is fine. Renders nothing when online. */
export function OfflineBanner() {
  const { isOnline } = useSyncStatus();
  const colors = useThemeColors();

  if (isOnline) return null;

  return (
    <Animated.View
      testID="offline-banner"
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(200)}
      className="flex-row items-center border-b border-warning/30 bg-warning/10 px-4 py-2"
    >
      <WifiOff size={16} color={colors.warning} />
      <Text className="ml-2 flex-1 text-xs font-medium text-foreground">
        {es.sync.offlineBanner}
      </Text>
    </Animated.View>
  );
}
