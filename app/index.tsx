import { Redirect } from 'expo-router';

/**
 * Root entry ("/"). Authenticated users land on the agenda; AuthGuard in
 * `_layout.tsx` sends unauthenticated users to login before this renders.
 */
export default function IndexScreen() {
  return <Redirect href={'/(drawer)/tasks' as never} />;
}
