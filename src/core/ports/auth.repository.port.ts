import type { AuthSession, AuthTokens, AuthUser, LoginCredentials } from '../types/auth.types';

export interface IAuthRepositoryPort {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken?: string): Promise<void>;
  getCurrentUser(): Promise<AuthUser>;
}
