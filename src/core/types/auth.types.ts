import { UserRole } from './role.enum';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  expiresAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
