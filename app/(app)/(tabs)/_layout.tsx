import { Tabs } from 'expo-router/js-tabs';
import { CalendarDays, Ellipsis, ShoppingCart, Users } from 'lucide-react-native';
import { es } from '@/shared/i18n/es';
import { FONT_FAMILY, useThemeColors } from '@/theme';

/** Bottom tabs: faster than a drawer for one-handed use in the field. */
export default function TabsLayout() {
  const colors = useThemeColors();

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
