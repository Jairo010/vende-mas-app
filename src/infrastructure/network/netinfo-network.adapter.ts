import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import type { INetworkStatusPort } from '@/core/ports/sync.ports';

/** Reachable when connected and the internet is not known to be unreachable. */
function isReachable(state: NetInfoState): boolean {
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

export const netInfoNetworkAdapter: INetworkStatusPort = {
  isOnline: async () => isReachable(await NetInfo.fetch()),
  subscribe: (listener) => NetInfo.addEventListener((state) => listener(isReachable(state))),
};
