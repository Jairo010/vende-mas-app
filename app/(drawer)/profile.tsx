import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, ShieldCheck } from 'lucide-react-native';
import { ScreenHeader } from '@/presentation/components/common';
import { Card } from '@/presentation/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';
import { UserRole } from '@/core/types/role.enum';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const isAdmin = user?.role === UserRole.ADMIN;
  const roleLabel = isAdmin ? es.drawer.roles.admin : es.drawer.roles.seller;
  const userInitial = (user?.name?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title={es.drawer.items.profile} subtitle="Datos de usuario y credenciales" />
      <View className="flex-1 p-5">
        <Card className="items-center p-6 mb-4">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary mb-4 shadow-md">
            <Text className="text-3xl font-bold text-primary-foreground">{userInitial}</Text>
          </View>
          <Text className="text-xl font-bold text-foreground">{user?.name || 'Usuario'}</Text>
          <Text className="text-sm text-muted-foreground mt-1">{user?.email || ''}</Text>
          <View className="mt-3 rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
            <Text className="text-xs font-semibold text-primary">{roleLabel}</Text>
          </View>
        </Card>

        <Card className="p-4 space-y-4">
          <View className="flex-row items-center py-2 border-b border-border">
            <User size={18} color={activeColors.mutedForeground} className="mr-3" />
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">Nombre Completo</Text>
              <Text className="text-sm font-semibold text-foreground">{user?.name || 'N/A'}</Text>
            </View>
          </View>

          <View className="flex-row items-center py-2 border-b border-border">
            <Mail size={18} color={activeColors.mutedForeground} className="mr-3" />
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">Correo Corporativo</Text>
              <Text className="text-sm font-semibold text-foreground">{user?.email || 'N/A'}</Text>
            </View>
          </View>

          <View className="flex-row items-center py-2">
            <ShieldCheck size={18} color={activeColors.mutedForeground} className="mr-3" />
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">Rol de Acceso</Text>
              <Text className="text-sm font-semibold text-foreground">{roleLabel}</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
}
