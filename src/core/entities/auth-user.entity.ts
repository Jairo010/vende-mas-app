import { UserRole } from '../types/role.enum';
import type { AuthUser } from '../types/auth.types';
import type { CompanyProfile, UserBranch } from '../types/company.types';

interface AuthUserProps {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  companyId?: string | null;
  company?: CompanyProfile | null;
  branches?: UserBranch[];
}

export class AuthUserEntity implements AuthUser {
  public readonly id: string;
  public readonly email: string;
  public readonly name: string;
  public readonly role: UserRole;
  public readonly isActive: boolean;
  public readonly companyId: string | null;
  public readonly company: CompanyProfile | null;
  public readonly branches: UserBranch[];

  constructor(params: AuthUserProps) {
    this.id = params.id;
    this.email = params.email;
    this.name = params.name;
    this.role = params.role;
    this.isActive = params.isActive ?? true;
    this.companyId = params.companyId ?? params.company?.id ?? null;
    this.company = params.company ?? null;
    this.branches = params.branches ?? [];
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public isSupervisor(): boolean {
    return this.role === UserRole.SUPERVISOR;
  }

  public isSeller(): boolean {
    return this.role === UserRole.SELLER;
  }

  /** Platform staff (no company) cannot work in the field app. */
  public canUseApp(): boolean {
    return this.role !== UserRole.SUPER_ADMIN && this.companyId !== null;
  }

  public static create(props: AuthUserProps): AuthUserEntity {
    return new AuthUserEntity(props);
  }
}
