import { AuthUserEntity } from '@/core/entities/auth-user.entity';
import { UserRole } from '@/core/types/role.enum';

describe('AuthUserEntity', () => {
  it('should instantiate an admin user correctly', () => {
    const user = AuthUserEntity.create({
      id: 'usr-123',
      email: 'admin@vendemas.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    });

    expect(user.id).toBe('usr-123');
    expect(user.email).toBe('admin@vendemas.com');
    expect(user.name).toBe('Admin User');
    expect(user.role).toBe(UserRole.ADMIN);
    expect(user.isActive).toBe(true);
    expect(user.isAdmin()).toBe(true);
    expect(user.isSeller()).toBe(false);
  });

  it('should instantiate a seller user correctly', () => {
    const user = new AuthUserEntity({
      id: 'usr-456',
      email: 'seller@vendemas.com',
      name: 'Seller User',
      role: UserRole.SELLER,
    });

    expect(user.id).toBe('usr-456');
    expect(user.role).toBe(UserRole.SELLER);
    expect(user.isActive).toBe(true);
    expect(user.isAdmin()).toBe(false);
    expect(user.isSeller()).toBe(true);
  });
});
