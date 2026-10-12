import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import * as Haptics from 'expo-haptics';
import {
  CalendarCheck,
  Users,
  ShoppingCart,
  MapPin,
  Target,
  Package,
  User,
  RefreshCw,
  Bell,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  Briefcase,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useLogout } from '@/application/hooks/auth/use-logout';
import { es } from '@/shared/i18n/es';
import { UserRole } from '@/core/types/role.enum';
import { darkColors, lightColors } from '@/theme/colors';

interface DrawerItemConfig {
  key: string;
  label: string;
  route: string;
  icon: typeof CalendarCheck;
}

export function AppDrawer(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { mode, setMode, getEffectiveScheme } = useThemeStore();
  const scheme = getEffectiveScheme();
  const activeColors = scheme === 'dark' ? darkColors : lightColors;
  const { logout, isPending: isLoggingOut } = useLogout();

  const isDark = scheme === 'dark';

  const commercialItems: DrawerItemConfig[] = [
    {
      key: 'tasks',
      label: es.drawer.items.tasks,
      route: '/tasks',
      icon: CalendarCheck,
    },
    {
      key: 'customers',
      label: es.drawer.items.customers,
      route: '/customers',
      icon: Users,
    },
    {
      key: 'sales',
      label: es.drawer.items.sales,
      route: '/sales',
      icon: ShoppingCart,
    },
    {
      key: 'visits',
      label: es.drawer.items.visits,
      route: '/visits',
      icon: MapPin,
    },
    {
      key: 'opportunities',
      label: es.drawer.items.opportunities,
      route: '/opportunities',
      icon: Target,
    },
    {
      key: 'catalog',
      label: es.drawer.items.catalog,
      route: '/catalog',
      icon: Package,
    },
  ];

  const systemItems: DrawerItemConfig[] = [
    {
      key: 'profile',
      label: es.drawer.items.profile,
      route: '/profile',
      icon: User,
    },
    {
      key: 'sync',
      label: es.drawer.items.sync,
      route: '/sync',
      icon: RefreshCw,
    },
    {
      key: 'notifications',
      label: es.drawer.items.notifications,
      route: '/notifications',
      icon: Bell,
    },
  ];

  const handleNavigate = async (item: DrawerItemConfig) => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignore
    }
    props.navigation.closeDrawer();
    router.push(item.route as never);
  };

  const toggleTheme = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
  };

  const handleLogoutPress = () => {
    Alert.alert(
      es.drawer.confirmLogoutTitle,
      es.drawer.confirmLogoutMessage,
      [
        {
          text: es.common.cancel,
          style: 'cancel',
        },
        {
          text: es.drawer.logout,
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
      { cancelable: true },
    );
  };

  const userInitial = (user?.name?.trim()?.charAt(0) || 'U').toUpperCase();
  const isAdmin = user?.role === UserRole.ADMIN;
  const roleLabel = isAdmin ? es.drawer.roles.admin : es.drawer.roles.seller;

  const renderItem = (item: DrawerItemConfig) => {
    const isActive =
      pathname.includes(item.route) ||
      (item.route === '/tasks' &&
        (pathname === '/' || pathname === '/tasks' || pathname.startsWith('/tasks')));
    const IconComponent = item.icon;

    return (
      <Pressable
        key={item.key}
        testID={`drawer-item-${item.key}`}
        onPress={() => handleNavigate(item)}
        className={`flex-row items-center rounded-xl px-3.5 py-3 mb-1 ${
          isActive ? 'bg-primary/10' : 'bg-transparent'
        }`}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <View
          className={`h-8 w-8 items-center justify-center rounded-lg mr-3 ${
            isActive ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <IconComponent
            size={18}
            color={isActive ? activeColors.primaryForeground : activeColors.mutedForeground}
          />
        </View>
        <Text
          className={`text-sm flex-1 ${
            isActive ? 'font-semibold text-primary' : 'font-medium text-foreground'
          }`}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      className="flex-1 bg-card"
      style={{
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      {/* Header Profile Section */}
      <View className="px-5 pt-4 pb-5 border-b border-border">
        <View className="flex-row items-center">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-sm"
            style={{ elevation: 2 }}
          >
            <Text className="text-xl font-bold text-primary-foreground">{userInitial}</Text>
          </View>
          <View className="ml-3.5 flex-1">
            <Text className="text-base font-bold text-foreground" numberOfLines={1}>
              {user?.name || 'Usuario'}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
              {user?.email || ''}
            </Text>
          </View>
        </View>

        {/* Role Pill Badge */}
        <View className="mt-3 flex-row items-center">
          <View
            className={`flex-row items-center rounded-full px-2.5 py-1 border ${
              isAdmin ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'
            }`}
          >
            {isAdmin ? (
              <ShieldCheck size={12} color={activeColors.primary} className="mr-1" />
            ) : (
              <Briefcase size={12} color={activeColors.mutedForeground} className="mr-1" />
            )}
            <Text
              className={`text-[11px] font-semibold ${
                isAdmin ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {roleLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 14 }}
        className="flex-1"
      >
        {/* Commercial Operations Section */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2">
          {es.drawer.commercialSection}
        </Text>
        {commercialItems.map(renderItem)}

        {/* System & Settings Section */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 mt-5 mb-2">
          {es.drawer.systemSection}
        </Text>
        {systemItems.map(renderItem)}
      </ScrollView>

      {/* Footer Controls: Theme Toggle & Logout */}
      <View className="px-4 pt-3 border-t border-border">
        {/* Theme Mode Toggle Button */}
        <Pressable
          onPress={toggleTheme}
          className="flex-row items-center justify-between rounded-xl px-3.5 py-2.5 mb-2 bg-muted/60"
        >
          <View className="flex-row items-center">
            {isDark ? (
              <Sun size={18} color={activeColors.warning} />
            ) : (
              <Moon size={18} color={activeColors.mutedForeground} />
            )}
            <Text className="ml-3 text-xs font-medium text-foreground">
              {isDark ? es.settings.themeLight : es.settings.themeDark}
            </Text>
          </View>
          <Text className="text-[11px] font-semibold text-muted-foreground uppercase">
            {isDark ? 'ON' : 'OFF'}
          </Text>
        </Pressable>

        {/* Logout Button */}
        <Pressable
          testID="drawer-logout-button"
          onPress={handleLogoutPress}
          disabled={isLoggingOut}
          className="flex-row items-center rounded-xl px-3.5 py-2.5 active:bg-destructive/10"
        >
          <LogOut size={18} color={activeColors.destructive} />
          <Text className="ml-3 text-xs font-semibold text-destructive">
            {isLoggingOut ? es.common.loading : es.drawer.logout}
          </Text>
        </Pressable>

        {/* App Version Tag */}
        <View className="mt-2 items-center">
          <Text className="text-[10px] text-muted-foreground/60">Vende Más App v1.0.0</Text>
        </View>
      </View>
    </View>
  );
}
