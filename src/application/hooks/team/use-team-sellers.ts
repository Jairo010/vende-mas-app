import { useQuery } from '@tanstack/react-query';
import type { ITeamRepositoryPort } from '@/core/ports/team.repository.port';
import type { TeamMember } from '@/core/types/team.types';
import { teamApiService } from '@/infrastructure/api/services/team-api.service';
import { teamKeys } from './team.keys';

const TEAM_STALE_TIME_MS = 10 * 60_000;

/** Sellers of the supervisor's team (online, with the last list cached for offline use). */
export function useTeamSellers(enabled: boolean, repository: ITeamRepositoryPort = teamApiService) {
  const query = useQuery<TeamMember[], Error>({
    queryKey: teamKeys.sellers(),
    queryFn: () => repository.findSellers(),
    enabled,
    staleTime: TEAM_STALE_TIME_MS,
    retry: 1,
  });

  return {
    sellers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
