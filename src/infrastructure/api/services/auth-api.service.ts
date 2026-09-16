import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { apiClient } from '@/infrastructure/api/client/api-client';
import { API_ENDPOINTS } from '@/shared/constants/api.constants';
import type { IAuthRepositoryPort } from '@/core/ports/auth.repository.port';
import type { AuthSession, AuthTokens, AuthUser, LoginCredentials } from '@/core/types/auth.types';
import type {
  CurrentUserResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
} from '@/infrastructure/api/dto/auth.dto';
import type { ApiResponse } from '@/core/types/api.types';
import { AuthMapper } from '@/application/mappers/auth.mapper';
import {
  AccountInactiveError,
  DomainError,
  InvalidCredentialsError,
  NetworkError,
} from '@/core/errors';

export class AuthApiService implements IAuthRepositoryPort {
  private readonly client: AxiosInstance;

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  public async login(credentials: LoginCredentials): Promise<AuthSession> {
    try {
      const payload: LoginRequestDto = {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      };

      const response = await this.client.post<ApiResponse<LoginResponseDto> | LoginResponseDto>(
        API_ENDPOINTS.auth.login,
        payload,
      );

      let rawData: unknown = response.data;
      if (rawData && typeof rawData === 'object') {
        const obj = rawData as Record<string, unknown>;
        if ('data' in obj && obj.data && typeof obj.data === 'object') {
          rawData = obj.data;
        }
      }
      const data = rawData as LoginResponseDto;

      return AuthMapper.toAuthSession(data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          throw new InvalidCredentialsError();
        }
        if (status === 403) {
          throw new AccountInactiveError();
        }
        if (!error.response) {
          throw new NetworkError(error.message || 'Error de conexión');
        }
      }

      if (error instanceof DomainError) {
        if (error.statusCode === 401 || error.code === 'AUTH_UNAUTHORIZED') {
          throw new InvalidCredentialsError();
        }
        if (error.statusCode === 403 || error.code === 'AUTH_FORBIDDEN') {
          throw new AccountInactiveError();
        }
        throw error;
      }

      throw error;
    }
  }

  public async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload: RefreshTokenRequestDto = { refreshToken };
      const response = await this.client.post<
        ApiResponse<RefreshTokenResponseDto> | RefreshTokenResponseDto
      >(API_ENDPOINTS.auth.refresh, payload);

      let rawData: unknown = response.data;
      if (rawData && typeof rawData === 'object') {
        const obj = rawData as Record<string, unknown>;
        if ('data' in obj && obj.data && typeof obj.data === 'object') {
          rawData = obj.data;
        }
      }
      const data = rawData as RefreshTokenResponseDto;

      return {
        accessToken: data.accessToken || (data.tokens && data.tokens.accessToken) || '',
        refreshToken: data.refreshToken || (data.tokens && data.tokens.refreshToken) || '',
        tokenType: data.tokenType || 'Bearer',
        expiresIn: data.expiresIn,
        expiresAt: data.expiresAt,
      };
    } catch (error: unknown) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw error;
    }
  }

  public async logout(refreshToken?: string): Promise<void> {
    try {
      await this.client.post(API_ENDPOINTS.auth.logout, {
        refreshToken,
      });
    } catch {
      // Best-effort logout; ignore server error to ensure local tokens are cleared
    }
  }

  public async getCurrentUser(): Promise<AuthUser> {
    const response = await this.client.get<
      ApiResponse<CurrentUserResponseDto> | CurrentUserResponseDto
    >(API_ENDPOINTS.auth.me);

    let rawData: unknown = response.data;
    if (rawData && typeof rawData === 'object') {
      const obj = rawData as Record<string, unknown>;
      if ('data' in obj && obj.data && typeof obj.data === 'object') {
        rawData = obj.data;
      }
    }
    const data = rawData as CurrentUserResponseDto;

    return AuthMapper.toDomainUser(data);
  }
}

export const authApiService = new AuthApiService();
