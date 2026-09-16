import { UserRole } from '../types/role.enum';
import type { AuthUser } from '../types/auth.types';

export class AuthUserEntity implements AuthUser {
  public readonly id: string;
  public readonly email: string;
  public readonly name: string;
  public readonly role: UserRole;
  public readonly isActive: boolean;

  constructor(params: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive?: boolean;
  }) {
    this.id = params.id;
    this.email = params.email;
    this.name = params.name;
    this.role = params.role;
    this.isActive = params.isActive ?? true;
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public isSeller(): boolean {
    return this.role === UserRole.SELLER;
  }

  public static create(props: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive?: boolean;
  }): AuthUserEntity {
    return new AuthUserEntity(props);
  }
}
