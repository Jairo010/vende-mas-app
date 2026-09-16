import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from '@/presentation/features/auth/login-form';
import { authApiService } from '@/infrastructure/api/services/auth-api.service';
import { es } from '@/shared/i18n/es';
import { UserRole } from '@/core/types/role.enum';

jest.mock('@/infrastructure/api/services/auth-api.service');

describe('LoginForm', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderComponent = async () =>
    await render(
      <QueryClientProvider client={queryClient}>
        <LoginForm />
      </QueryClientProvider>,
    );

  it('should render email, password inputs, and submit button', async () => {
    const { getByTestId, getByText } = await renderComponent();

    expect(getByTestId('input-email')).toBeTruthy();
    expect(getByTestId('input-password')).toBeTruthy();
    expect(getByTestId('button-submit')).toBeTruthy();
    expect(getByText(es.auth.submitButton)).toBeTruthy();
  });

  it('should toggle password visibility on eye button press', async () => {
    const { getByTestId } = await renderComponent();

    const passwordInput = getByTestId('input-password');
    const toggleButton = getByTestId('toggle-password-visibility');

    expect(passwordInput.props.secureTextEntry).toBe(true);

    await fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(false);

    await fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('should display validation errors when submitting empty form', async () => {
    const { getByTestId, findByText } = await renderComponent();

    const submitButton = getByTestId('button-submit');
    await fireEvent.press(submitButton);

    const emailError = await findByText(es.auth.errors.emailRequired);
    const passwordError = await findByText(es.auth.errors.passwordRequired);

    expect(emailError).toBeTruthy();
    expect(passwordError).toBeTruthy();
  });

  it('should call auth service with credentials on valid submit', async () => {
    const mockedLogin = jest.spyOn(authApiService, 'login').mockResolvedValueOnce({
      user: {
        id: 'usr-submit-test',
        email: 'seller@vendemas.com',
        name: 'Seller',
        role: UserRole.SELLER,
        isActive: true,
      },
      tokens: {
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
      },
    });

    const { getByTestId } = await renderComponent();

    const emailInput = getByTestId('input-email');
    const passwordInput = getByTestId('input-password');
    const submitButton = getByTestId('button-submit');

    await fireEvent.changeText(emailInput, 'seller@vendemas.com');
    await fireEvent.changeText(passwordInput, 'password123');

    await fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith({
        email: 'seller@vendemas.com',
        password: 'password123',
        rememberMe: false,
      });
    });
  });
});
