import { useEffect, useRef } from 'react';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import { useSyncRunner } from '@/application/hooks/sync/use-sync-runner';
import { useVisitDraftStore } from '@/stores/visit-draft.store';

/**
 * A finished visit without its next one holds the seller (app ADR 0015): reopening the app takes
 * them back to it, once, as soon as navigation is ready.
 */
function usePendingFollowUp() {
  const router = useRouter();
  const ready = Boolean(useRootNavigationState()?.key);
  const opened = useRef(false);

  useEffect(() => {
    if (!ready || opened.current) return;
    opened.current = true;
    const visitId = useVisitDraftStore.getState().pendingFollowUpId;
    if (visitId) router.push({ pathname: '/(app)/visit/[id]', params: { id: visitId } });
  }, [ready, router]);
}

/**
 * Signed-in area: bottom tabs plus the stack screens opened from them. Keeps the device
 * in sync while it is mounted.
 */
export default function AppLayout() {
  useSyncRunner();
  usePendingFollowUp();

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
