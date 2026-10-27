import { Tabs } from 'expo-router/js-tabs';
import { useCompanyModules } from '@/application/hooks/auth/use-company-modules';
import { CalendarDays, Ellipsis, ShoppingCart, Users } from 'lucide-react-native';
import { es } from '@/shared/i18n/es';
import { FONT_FAMILY, useThemeColors } from '@/theme';

/** Bottom tabs: faster than a drawer for one-handed use in the field (contracted modules only). */
export default function TabsLayout() {
  const colors = useThemeColors();
  const modules = useCompanyModules();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="agenda"
        options={{
          title: es.tabs.agenda,
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: es.tabs.customers,
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: es.tabs.orders,
          // Hidden (not just disabled) when the company has no orders module.
          href: modules.has('ORDERS') ? undefined : null,
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: es.tabs.more,
          tabBarIcon: ({ color, size }) => <Ellipsis color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
