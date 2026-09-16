import { Tabs } from 'expo-router';
import { t } from '@/shared/i18n';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'hsl(221, 83%, 30%)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: t('tabs.customers'),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('tabs.tasks'),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: t('tabs.sales'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
        }}
      />
    </Tabs>
  );
}
