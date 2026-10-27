import type { CompanyProfile, UserBranch } from './company.types';
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
  /** Null only for platform staff (who cannot use the app). */
  companyId: string | null;
  /** Filled from `auth/me`; null until known. */
  company: CompanyProfile | null;
  branches: UserBranch[];
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
