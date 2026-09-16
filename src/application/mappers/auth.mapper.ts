import { UserRole } from '@/core/types/role.enum';
import type { AuthSession, AuthUser } from '@/core/types/auth.types';
import type {
  CurrentUserResponseDto,
  LoginResponseDto,
  UserPayloadDto,
} from '@/infrastructure/api/dto/auth.dto';

export class AuthMapper {
  public static toDomainRole(role?: unknown): UserRole {
    if (!role) {
      return UserRole.SELLER;
    }

    let roleStr = '';
    if (typeof role === 'string') {
      roleStr = role;
    } else if (typeof role === 'object' && role !== null) {
      const roleObj = role as Record<string, unknown>;
      if (typeof roleObj.name === 'string') {
        roleStr = roleObj.name;
      } else if (typeof roleObj.code === 'string') {
        roleStr = roleObj.code;
      } else if (typeof roleObj.value === 'string') {
        roleStr = roleObj.value;
      }
    }

    const normalized = roleStr.trim().toUpperCase();
    if (normalized === 'ADMIN' || normalized === 'ADMINISTRATOR') {
      return UserRole.ADMIN;
    }

    return UserRole.SELLER;
  }

  public static toDomainUser(
    dto: LoginResponseDto | CurrentUserResponseDto | UserPayloadDto,
  ): AuthUser {
    const raw = dto as Record<string, unknown>;

    // Support nested user objects: dto.user or dto.data.user or raw
    let source = raw;
    if (raw.user && typeof raw.user === 'object') {
      source = raw.user as Record<string, unknown>;
    } else if (raw.data && typeof raw.data === 'object') {
      const dataObj = raw.data as Record<string, unknown>;
      if (dataObj.user && typeof dataObj.user === 'object') {
        source = dataObj.user as Record<string, unknown>;
      } else {
        source = dataObj;
      }
    }

    const email = typeof source.email === 'string' ? source.email : '';
    const id = String(source.id || source.userId || source._id || email || 'unknown-user');
    const name = String(source.name || source.fullName || email.split('@')[0] || 'Usuario');
    const role = AuthMapper.toDomainRole(source.role);
    const isActive = typeof source.isActive === 'boolean' ? source.isActive : true;

    return {
      id,
      email,
      name,
      role,
      isActive,
    };
  }

  public static toAuthSession(dto: LoginResponseDto): AuthSession {
    const raw = dto as Record<string, unknown>;

    // Handle nested tokens object or root tokens or dto.data
    let tokenSource = raw;
    if (raw.tokens && typeof raw.tokens === 'object') {
      tokenSource = raw.tokens as Record<string, unknown>;
    } else if (raw.data && typeof raw.data === 'object') {
      const dataObj = raw.data as Record<string, unknown>;
      if (dataObj.tokens && typeof dataObj.tokens === 'object') {
        tokenSource = dataObj.tokens as Record<string, unknown>;
      } else {
        tokenSource = dataObj;
      }
    }

    const accessToken = String(
      tokenSource.accessToken || tokenSource.token || raw.accessToken || raw.token || '',
    );
    const refreshToken = String(tokenSource.refreshToken || raw.refreshToken || '');
    const tokenType =
      typeof tokenSource.tokenType === 'string'
        ? tokenSource.tokenType
        : typeof raw.tokenType === 'string'
          ? raw.tokenType
          : 'Bearer';
    const expiresIn =
      typeof tokenSource.expiresIn === 'number'
        ? tokenSource.expiresIn
        : typeof raw.expiresIn === 'number'
          ? raw.expiresIn
          : undefined;
    const expiresAt =
      typeof tokenSource.expiresAt === 'string'
        ? tokenSource.expiresAt
        : typeof raw.expiresAt === 'string'
          ? raw.expiresAt
          : undefined;

    const user = AuthMapper.toDomainUser(dto);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
        tokenType,
        expiresIn,
        expiresAt,
      },
    };
  }
}
