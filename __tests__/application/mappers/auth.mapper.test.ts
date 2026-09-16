import { AuthMapper } from '@/application/mappers/auth.mapper';
import { UserRole } from '@/core/types/role.enum';
import type { CurrentUserResponseDto, LoginResponseDto } from '@/infrastructure/api/dto/auth.dto';

describe('AuthMapper', () => {
  describe('toDomainRole', () => {
    it('should map ADMIN to UserRole.ADMIN', () => {
      expect(AuthMapper.toDomainRole('ADMIN')).toBe(UserRole.ADMIN);
      expect(AuthMapper.toDomainRole('admin')).toBe(UserRole.ADMIN);
    });

    it('should map SELLER or any other string to UserRole.SELLER', () => {
      expect(AuthMapper.toDomainRole('SELLER')).toBe(UserRole.SELLER);
      expect(AuthMapper.toDomainRole('UNKNOWN')).toBe(UserRole.SELLER);
    });

    it('should safely handle undefined or null role and default to UserRole.SELLER', () => {
      expect(AuthMapper.toDomainRole(undefined)).toBe(UserRole.SELLER);
      expect(AuthMapper.toDomainRole(null)).toBe(UserRole.SELLER);
      expect(AuthMapper.toDomainRole('')).toBe(UserRole.SELLER);
    });

    it('should handle role as an object with name or code property', () => {
      expect(AuthMapper.toDomainRole({ name: 'ADMIN' })).toBe(UserRole.ADMIN);
      expect(AuthMapper.toDomainRole({ code: 'ADMIN' })).toBe(UserRole.ADMIN);
      expect(AuthMapper.toDomainRole({ name: 'SELLER' })).toBe(UserRole.SELLER);
    });
  });

  describe('toDomainUser', () => {
    it('should map LoginResponseDto to AuthUser', () => {
      const loginDto: LoginResponseDto = {
        userId: 'usr-100',
        email: 'seller@vendemas.com',
        name: 'Carlos Vendedor',
        role: 'SELLER',
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
      };

      const user = AuthMapper.toDomainUser(loginDto);
      expect(user.id).toBe('usr-100');
      expect(user.email).toBe('seller@vendemas.com');
      expect(user.name).toBe('Carlos Vendedor');
      expect(user.role).toBe(UserRole.SELLER);
      expect(user.isActive).toBe(true);
    });

    it('should map nested user payload to AuthUser', () => {
      const nestedDto: LoginResponseDto = {
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
        user: {
          id: 'usr-nested',
          email: 'admin@vendemas.com',
          name: 'Admin User',
          role: 'ADMIN',
        },
      };

      const user = AuthMapper.toDomainUser(nestedDto);
      expect(user.id).toBe('usr-nested');
      expect(user.email).toBe('admin@vendemas.com');
      expect(user.name).toBe('Admin User');
      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.isActive).toBe(true);
    });

    it('should map CurrentUserResponseDto to AuthUser', () => {
      const meDto: CurrentUserResponseDto = {
        id: 'usr-200',
        email: 'admin@vendemas.com',
        name: 'Ana Admin',
        role: 'ADMIN',
        isActive: false,
      };

      const user = AuthMapper.toDomainUser(meDto);
      expect(user.id).toBe('usr-200');
      expect(user.email).toBe('admin@vendemas.com');
      expect(user.name).toBe('Ana Admin');
      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.isActive).toBe(false);
    });
  });

  describe('toAuthSession', () => {
    it('should map LoginResponseDto to AuthSession', () => {
      const loginDto: LoginResponseDto = {
        userId: 'usr-300',
        email: 'seller@vendemas.com',
        name: 'Luis Vendedor',
        role: 'SELLER',
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        expiresAt: '2026-10-01T00:00:00.000Z',
      };

      const session = AuthMapper.toAuthSession(loginDto);
      expect(session.user.id).toBe('usr-300');
      expect(session.tokens.accessToken).toBe('jwt-access-token');
      expect(session.tokens.refreshToken).toBe('jwt-refresh-token');
      expect(session.tokens.tokenType).toBe('Bearer');
      expect(session.tokens.expiresIn).toBe(3600);
    });

    it('should map nested user and tokens payload to AuthSession', () => {
      const nestedDto: LoginResponseDto = {
        accessToken: 'jwt-access-456',
        refreshToken: 'jwt-refresh-456',
        user: {
          id: 'usr-400',
          email: 'admin@vendemas.com',
          name: 'Super Admin',
          role: 'ADMIN',
        },
      };

      const session = AuthMapper.toAuthSession(nestedDto);
      expect(session.user.id).toBe('usr-400');
      expect(session.user.role).toBe(UserRole.ADMIN);
      expect(session.tokens.accessToken).toBe('jwt-access-456');
      expect(session.tokens.refreshToken).toBe('jwt-refresh-456');
    });
  });
});
