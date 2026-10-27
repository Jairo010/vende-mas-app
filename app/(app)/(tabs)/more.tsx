import { Alert, ScrollView, Text, View } from 'react-native';
import { useCompanyModules } from '@/application/hooks/auth/use-company-modules';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { HandCoins, LogOut } from 'lucide-react-native';
import { useAuthSession } from '@/application/hooks/auth/use-auth-session';
import { useLogout } from '@/application/hooks/auth/use-logout';
import { useSyncStatus } from '@/application/hooks/sync/use-sync-status';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { Avatar } from '@/presentation/components/ui/avatar';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { ListItem } from '@/presentation/components/ui/list-item';
import { ThemeSelector } from '@/presentation/features/settings/theme-selector';
import { SyncPanel } from '@/presentation/features/sync/sync-panel';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

/** Profile (company and branch), appearance (theme), sync status and session. */
export default function MoreScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const modules = useCompanyModules();
  const { user } = useAuthSession();
  const { pendingCount } = useSyncStatus();
  // Records are assigned by the server to the primary branch (ADR 0008).
  const branch = user?.branches.find((item) => item.isPrimary) ?? user?.branches[0] ?? null;
  const { logout, isPending } = useLogout();

  const confirmLogout = () => {
    Alert.alert(
      es.more.logoutTitle,
      pendingCount > 0 ? es.more.logoutPendingMessage : es.more.logoutMessage,
      [
        { text: es.common.cancel, style: 'cancel' },
        { text: es.more.logout, style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={es.more.title} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card className="flex-row items-center p-4">
          <Avatar name={user?.name ?? '?'} size="md" />
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-foreground" numberOfLines={1}>
              {user?.name}
            </Text>
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
              {user?.email}
            </Text>
            {user ? (
              <Badge className="mt-1.5" size="sm" variant="primary" label={es.roles[user.role]} />
            ) : null}
          </View>
        </Card>

        {user?.company ? (
          <Card className="gap-1 p-4" testID="more-company">
            <Text className="text-xs text-muted-foreground">{es.more.company}</Text>
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {user.company.tradeName}
            </Text>
            {branch ? (
              <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                {es.more.branch(branch.name)}
              </Text>
            ) : null}
          </Card>
        ) : null}

        <Card className="p-4">
          <Text className="mb-3 text-base font-semibold text-foreground">{es.more.appearance}</Text>
          <ThemeSelector />
        </Card>

        {modules.has('COLLECTIONS') ? (
          <Card className="overflow-hidden p-0">
            <ListItem
              testID="more-collections"
              title={es.more.collections}
              subtitle={es.more.collectionsDescription}
              leading={
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted">
                  <HandCoins size={18} color={colors.foreground} />
                </View>
              }
              onPress={() => router.push('/(app)/collections')}
            />
          </Card>
        ) : null}

        <SyncPanel onOpenQueue={() => router.push('/(app)/sync')} />

        <Button
          testID="logout-button"
          variant="outline"
          isLoading={isPending}
          leftIcon={<LogOut size={16} color={colors.destructive} />}
          textClassName="text-destructive"
          onPress={confirmLogout}
        >
          {es.more.logout}
        </Button>

        <Text className="text-center text-xs text-muted-foreground">
          {es.more.version} {Constants.expoConfig?.version ?? ''}
        </Text>
      </ScrollView>
    </View>
  );
}
