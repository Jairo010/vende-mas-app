import { AuthLayout } from '@/presentation/layouts/auth-layout';
import { AuthHeader } from '@/presentation/features/auth/auth-header';
import { LoginForm } from '@/presentation/features/auth/login-form';

export default function LoginScreen() {
  return (
    <AuthLayout>
      <AuthHeader />
      <LoginForm />
    </AuthLayout>
  );
}
