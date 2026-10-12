import { Drawer } from 'expo-router/drawer';
import { AppDrawer } from '@/presentation/components/common/app-drawer';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';

export default function DrawerLayout() {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <Drawer
      drawerContent={(props) => <AppDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
          backgroundColor: activeColors.card,
        },
        drawerType: 'front',
        overlayColor: 'rgba(0, 0, 0, 0.65)',
      }}
    >
      <Drawer.Screen
        name="tasks"
        options={{
          title: 'Agenda y Tareas',
        }}
      />
      <Drawer.Screen
        name="customers"
        options={{
          title: 'Clientes',
        }}
      />
      <Drawer.Screen
        name="sales"
        options={{
          title: 'Ventas y Pedidos',
        }}
      />
      <Drawer.Screen
        name="visits"
        options={{
          title: 'Rutas de Visita',
        }}
      />
      <Drawer.Screen
        name="opportunities"
        options={{
          title: 'Oportunidades',
        }}
      />
      <Drawer.Screen
        name="catalog"
        options={{
          title: 'Catálogo',
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Mi Perfil',
        }}
      />
      <Drawer.Screen
        name="sync"
        options={{
          title: 'Sincronización',
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          title: 'Notificaciones',
        }}
      />
    </Drawer>
  );
}
