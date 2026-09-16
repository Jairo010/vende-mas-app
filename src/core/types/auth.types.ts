import { UserRole } from './role.enum';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}
