import type { AxiosInstance } from 'axios';
import type { IStoragePort } from '@/core/ports/storage.port';
import type { ITeamRepositoryPort } from '@/core/ports/team.repository.port';
import type { TeamMember } from '@/core/types/team.types';
import { apiClient } from '@/infrastructure/api/client/api-client';
import { unwrapApiData } from '@/infrastructure/api/client/unwrap-response';
import type { FindUsersQueryDto, UserSummaryResponseDto } from '@/infrastructure/api/dto/user.dto';
import { mmkvStorageAdapter } from '@/infrastructure/storage/mmkv-storage.adapter';
import { API_ENDPOINTS } from '@/shared/constants/api.constants';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';

/** A supervisor's team is small; one page covers it. */
const TEAM_PAGE_SIZE = 100;

function toTeamMember(dto: UserSummaryResponseDto): TeamMember {
  const name = dto.name?.trim() || `${dto.firstName ?? ''} ${dto.lastName ?? ''}`.trim();
  return { id: dto.id, name: name || dto.email, email: dto.email };
}

/**
 * Sellers the signed-in supervisor can assign visits to. The API scopes `GET /users` to the
 * supervisor's team. The last answer is cached so visits can still be assigned offline.
 */
export class TeamApiService implements ITeamRepositoryPort {
  constructor(
    private readonly client: AxiosInstance = apiClient,
    private readonly storage: IStoragePort = mmkvStorageAdapter,
  ) {}

  public async findSellers(): Promise<TeamMember[]> {
    try {
      const params: FindUsersQueryDto = { role: 'SELLER', isActive: true, limit: TEAM_PAGE_SIZE };
      const response = await this.client.get<unknown>(API_ENDPOINTS.users.list, { params });
      const sellers = unwrapApiData<UserSummaryResponseDto[]>(response.data)
        .map(toTeamMember)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
      this.storage.setString(STORAGE_KEYS.TEAM_SELLERS, JSON.stringify(sellers));
      return sellers;
    } catch (error) {
      const cached = this.readCache();
      if (cached) return cached;
      throw error;
    }
  }

  public clearCache(): void {
    this.storage.delete(STORAGE_KEYS.TEAM_SELLERS);
  }

  private readCache(): TeamMember[] | null {
    const raw = this.storage.getString(STORAGE_KEYS.TEAM_SELLERS);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as TeamMember[]) : null;
    } catch {
      return null;
    }
  }
}

export const teamApiService = new TeamApiService();
