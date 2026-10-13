import { Redirect } from 'expo-router';

/**
 * Root entry ("/"). Authenticated users land on the agenda; the root layout sends
 * unauthenticated users to login before this renders.
 */
export default function IndexScreen() {
  return <Redirect href="/(app)/(tabs)/agenda" />;
}
