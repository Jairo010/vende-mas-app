import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, LogOut, Store, UserRoundCog } from 'lucide-react-native';
import { useLogout } from '@/application/hooks/auth/use-logout';
import { useWorkingBranch } from '@/application/hooks/auth/use-working-branch';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { notify } from '@/presentation/components/feedback/toast';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { StickyFooter } from '@/presentation/components/ui/sticky-footer';
import { useSyncStore } from '@/stores/sync.store';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

const t = es.branch;

/**
 * Where the seller works. Right after signing in (users of several branches must choose) and,
 * with `?mode=switch`, from Más to move to another of their branches. A branch of another
 * account cannot be listed here: that option signs out so they log in with that account.
 */
export default function BranchScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const switching = mode === 'switch';
  const { branches, active, switchTo } = useWorkingBranch();
  const { logout } = useLogout();
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const [selected, setSelected] = useState<string | null>(
    active?.id ?? branches.find((branch) => branch.isPrimary)?.id ?? branches[0]?.id ?? null,
  );

  const confirm = () => {
    if (!selected) return;
    const branch = branches.find((item) => item.id === selected);
    if (switchTo(selected) === 'PENDING_CHANGES') {
      Alert.alert(t.pendingTitle, t.pendingMessage);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (switching) {
      if (branch && branch.id !== active?.id) notify.success(t.switched(branch.name));
      router.back();
    } else {
      router.replace('/(app)/(tabs)/agenda');
    }
  };

  const chooseOtherAccount = () => {
    Alert.alert(
      t.otherAccountTitle,
      pendingCount > 0 ? t.otherAccountPendingMessage : t.otherAccountMessage,
      [
        { text: es.common.cancel, style: 'cancel' },
        { text: t.otherAccountConfirm, style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        withSafeArea
        title={switching ? t.switchTitle : t.chooseTitle}
        subtitle={switching ? t.switchSubtitle : t.chooseSubtitle}
        {...(switching ? { onBack: () => router.back() } : {})}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        <View accessibilityRole="radiogroup" className="gap-3">
          {branches.map((branch) => {
            const isSelected = branch.id === selected;
            return (
              <Pressable
                key={branch.id}
                testID={`branch-option-${branch.code}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelected(branch.id);
                }}
                className={`flex-row items-center rounded-2xl border bg-card p-4 active:opacity-80 ${
                  isSelected ? 'border-primary' : 'border-border'
                }`}
                style={isSelected ? { borderWidth: 2 } : undefined}
              >
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-muted">
                  <Store size={20} color={isSelected ? colors.primary : colors.mutedForeground} />
                </View>
                <View className="ml-3 flex-1 gap-1">
                  <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                    {branch.name}
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {branch.isPrimary ? (
                      <Badge size="sm" variant="outline" label={t.primary} />
                    ) : null}
                    {switching && branch.id === active?.id ? (
                      <Badge size="sm" variant="primary" label={t.current} />
                    ) : null}
                  </View>
                </View>
                {isSelected ? <Check size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Card className="overflow-hidden p-0">
          <Pressable
            testID="branch-other-account"
            onPress={chooseOtherAccount}
            className="flex-row items-center p-4 active:opacity-80"
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-muted">
              <UserRoundCog size={20} color={colors.foreground} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-foreground">{t.otherAccount}</Text>
              <Text className="text-sm text-muted-foreground">{t.otherAccountHint}</Text>
            </View>
            <LogOut size={18} color={colors.mutedForeground} />
          </Pressable>
        </Card>
      </ScrollView>
      <StickyFooter>
        <Button testID="branch-confirm" disabled={!selected} onPress={confirm}>
          {switching ? t.switch : t.continue}
        </Button>
      </StickyFooter>
    </View>
  );
}
