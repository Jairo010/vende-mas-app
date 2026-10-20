import { Stack } from 'expo-router';
import { useSyncRunner } from '@/application/hooks/sync/use-sync-runner';

/**
 * Signed-in area: bottom tabs plus the stack screens opened from them. Keeps the device
 * in sync while it is mounted.
 */
export default function AppLayout() {
  useSyncRunner();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="visit/[id]" />
      <Stack.Screen name="visit/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="order/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="customer/[id]/index" />
      <Stack.Screen name="customer/[id]/billing" />
      <Stack.Screen name="route" />
      <Stack.Screen name="sync" />
      <Stack.Screen name="collections" />
      <Stack.Screen name="payment/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="payment/[id]" />
    </Stack>
  );
}
