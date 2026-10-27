import { useCallback } from 'react';
import { useSyncNow } from '@/application/hooks/sync/use-sync-now';
import type { UserBranch } from '@/core/types/company.types';
import { useAuthStore } from '@/stores/auth.store';
import { useSyncStore } from '@/stores/sync.store';

export type SwitchBranchResult = 'SWITCHED' | 'PENDING_CHANGES';

export interface UseWorkingBranchResult {
  /** Branches the user belongs to (primary first, as the API sends them). */
  branches: UserBranch[];
  /** The branch the user works in now (null until chosen). */
  active: UserBranch | null;
  /**
   * Works in another branch. Refused while changes are waiting to be sent: they would be
   * recorded in the new branch instead of the one where they were made.
   */
  switchTo: (branchId: string) => SwitchBranchResult;
}

/** The branch a seller of several branches works in, and how to change it. */
export function useWorkingBranch(): UseWorkingBranchResult {
  const branches = useAuthStore((state) => state.user?.branches ?? []);
  const activeId = useAuthStore((state) => state.activeBranchId);
  const setActiveBranch = useAuthStore((state) => state.setActiveBranch);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const { syncNow } = useSyncNow();

  const switchTo = useCallback(
    (branchId: string): SwitchBranchResult => {
      if (branchId === activeId) return 'SWITCHED';
      if (pendingCount > 0) return 'PENDING_CHANGES';
      setActiveBranch(branchId);
      // Refresh right away so the next screens reflect the new branch.
      void syncNow();
      return 'SWITCHED';
    },
    [activeId, pendingCount, setActiveBranch, syncNow],
  );

  return {
    branches,
    active: branches.find((branch) => branch.id === activeId) ?? null,
    switchTo,
  };
}
