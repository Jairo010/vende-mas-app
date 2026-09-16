import type { AxiosInstance } from 'axios';
import { AuthApiService } from '@/infrastructure/api/services/auth-api.service';
import { UserRole } from '@/core/types/role.enum';
import { AccountInactiveError, InvalidCredentialsError, NetworkError } from '@/core/errors';

describe('AuthApiService', () => {
  let mockAxios: {
    post: jest.Mock;
    get: jest.Mock;
  };
  let service: AuthApiService;

  beforeEach(() => {
    mockAxios = {
      post: jest.fn(),
      get: jest.fn(),
    };
    service = new AuthApiService(mockAxios as unknown as AxiosInstance);
  });

  describe('login', () => {
    it('should call login endpoint and return AuthSession on success', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          statusCode: 200,
          message: 'Login successful',
          data: {
            userId: 'usr-1',
            email: 'seller@vendemas.com',
            name: 'Seller User',
            role: 'SELLER',
            accessToken: 'token-123',
            refreshToken: 'refresh-123',
            tokenType: 'Bearer',
            expiresIn: 3600,
          },
        },
      });

      const session = await service.login({
        email: 'seller@vendemas.com',
        password: 'password123',
      });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        email: 'seller@vendemas.com',
        password: 'password123',
      });
      expect(session.user.id).toBe('usr-1');
      expect(session.user.role).toBe(UserRole.SELLER);
      expect(session.tokens.accessToken).toBe('token-123');
    });

    it('should translate 401 error to InvalidCredentialsError', async () => {
      mockAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      await expect(
        service.login({
          email: 'invalid@vendemas.com',
          password: 'wrongpassword',
        }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it('should translate 403 error to AccountInactiveError', async () => {
      mockAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 403, data: { message: 'Account is inactive' } },
      });

      await expect(
        service.login({
          email: 'inactive@vendemas.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(AccountInactiveError);
    });

    it('should translate network failure to NetworkError', async () => {
      mockAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        message: 'Network Error',
        response: undefined,
      });

      await expect(
        service.login({
          email: 'user@vendemas.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(NetworkError);
    });
  });

  describe('refreshToken', () => {
    it('should call refresh endpoint and return new tokens', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          statusCode: 200,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            tokenType: 'Bearer',
          },
        },
      });

      const tokens = await service.refreshToken('old-refresh-token');

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(tokens.accessToken).toBe('new-access-token');
      expect(tokens.refreshToken).toBe('new-refresh-token');
    });
  });

  describe('logout', () => {
    it('should call logout endpoint with refreshToken', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: { message: 'Logged out' } });

      await service.logout('refresh-token-to-invalidate');

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/auth/logout', {
        refreshToken: 'refresh-token-to-invalidate',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should call me endpoint and return AuthUser', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: {
          id: 'usr-current',
          email: 'me@vendemas.com',
          name: 'Current User',
          role: 'ADMIN',
          isActive: true,
        },
      });

      const user = await service.getCurrentUser();

      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/auth/me');
      expect(user.id).toBe('usr-current');
      expect(user.role).toBe(UserRole.ADMIN);
    });
  });
});
