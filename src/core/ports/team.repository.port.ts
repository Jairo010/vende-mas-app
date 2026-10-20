import type { TeamMember } from '../types/team.types';

/** Sellers a supervisor can assign visits to (`GET /users`, cached for offline use). */
export interface ITeamRepositoryPort {
  findSellers(): Promise<TeamMember[]>;
  /** Forgets the cached team (logout). */
  clearCache(): void;
}
