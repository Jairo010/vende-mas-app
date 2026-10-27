import type { CompanyProfileDto, UserBranchDto } from './company.dto';

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface UserPayloadDto {
  id?: string;
  userId?: string;
  _id?: string;
  email?: string;
  name?: string;
  fullName?: string;
  role?: string | { id?: string; name?: string; code?: string };
  isActive?: boolean;
}

export interface LoginResponseDto {
  userId?: string;
  companyId?: string | null;
  id?: string;
  email?: string;
  name?: string;
  role?: string | { id?: string; name?: string; code?: string };
  isActive?: boolean;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  tokenType?: string;
  expiresIn?: number;
  expiresAt?: string;

  user?: UserPayloadDto;
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    expiresAt?: string;
  };
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  userId?: string;
  id?: string;
  email?: string;
  name?: string;
  role?: string | { id?: string; name?: string; code?: string };
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  tokenType?: string;
  expiresIn?: number;
  expiresAt?: string;
  user?: UserPayloadDto;
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface CurrentUserResponseDto {
  id?: string;
  userId?: string;
  _id?: string;
  email?: string;
  name?: string;
  fullName?: string;
  role?: string | { id?: string; name?: string; code?: string };
  isActive?: boolean;
  companyId?: string | null;
  company?: CompanyProfileDto | null;
  branches?: UserBranchDto[];
  createdAt?: string;
  updatedAt?: string;
  user?: UserPayloadDto;
}

export interface LogoutResponseDto {
  message?: string;
}
