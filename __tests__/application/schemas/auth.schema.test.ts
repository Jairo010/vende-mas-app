import { loginSchema } from '@/application/schemas/auth.schema';
import { es } from '@/shared/i18n/es';

describe('loginSchema', () => {
  it('should validate valid email and password credentials', () => {
    const validData = {
      email: 'user@vendemas.com',
      password: 'password123',
      rememberMe: true,
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@vendemas.com');
      expect(result.data.password).toBe('password123');
      expect(result.data.rememberMe).toBe(true);
    }
  });

  it('should reject empty email', () => {
    const invalidData = {
      email: '',
      password: 'password123',
      rememberMe: false,
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((e) => e.path.includes('email'));
      expect(emailError?.message).toBe(es.auth.errors.emailRequired);
    }
  });

  it('should reject malformed email', () => {
    const invalidData = {
      email: 'invalid-email-format',
      password: 'password123',
      rememberMe: false,
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((e) => e.path.includes('email'));
      expect(emailError?.message).toBe(es.auth.errors.emailInvalid);
    }
  });

  it('should reject empty password', () => {
    const invalidData = {
      email: 'user@vendemas.com',
      password: '',
      rememberMe: false,
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find((e) => e.path.includes('password'));
      expect(passwordError?.message).toBe(es.auth.errors.passwordRequired);
    }
  });

  it('should reject password with less than 6 characters', () => {
    const invalidData = {
      email: 'user@vendemas.com',
      password: '12345',
      rememberMe: false,
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find((e) => e.path.includes('password'));
      expect(passwordError?.message).toBe(es.auth.errors.passwordMinLength);
    }
  });
});
