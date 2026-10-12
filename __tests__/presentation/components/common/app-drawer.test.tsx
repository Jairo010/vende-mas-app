import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppDrawer } from '@/presentation/components/common/app-drawer';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/core/types/role.enum';
import type { DrawerContentComponentProps } from 'expo-router/drawer';

// Mock expo-router without requireActual
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  usePathname: () => '/tasks',
}));

describe('AppDrawer', () => {
  let mockProps: DrawerContentComponentProps;
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockProps = {
      state: {
        routes: [{ name: 'tasks', key: 'tasks-1' }],
        index: 0,
        routeNames: ['tasks'],
        history: [],
        type: 'drawer',
        stale: false,
        key: 'drawer-key',
      } as unknown as DrawerContentComponentProps['state'],
      navigation: {
        closeDrawer: jest.fn(),
        openDrawer: jest.fn(),
        navigate: jest.fn(),
      } as unknown as DrawerContentComponentProps['navigation'],
      descriptors: {},
    };

    useAuthStore.getState().setUser({
      id: 'usr-drawer-1',
      email: 'carlos@vendemas.com',
      name: 'Carlos Mendoza',
      role: UserRole.SELLER,
      isActive: true,
    });
  });

  it('should render user profile name, email, and role', async () => {
    const { getByText } = await render(<AppDrawer {...mockProps} />, { wrapper });

    expect(getByText('Carlos Mendoza')).toBeTruthy();
    expect(getByText('carlos@vendemas.com')).toBeTruthy();
    expect(getByText('Asesor Comercial')).toBeTruthy();
  });

  it('should render commercial drawer items and navigate on press', async () => {
    const { getByTestId, getByText } = await render(<AppDrawer {...mockProps} />, { wrapper });

    expect(getByText('Agenda y Tareas')).toBeTruthy();
    expect(getByText('Clientes')).toBeTruthy();
    expect(getByText('Ventas y Pedidos')).toBeTruthy();

    const customersItem = getByTestId('drawer-item-customers');
    fireEvent.press(customersItem);

    await waitFor(() => {
      expect(mockProps.navigation.closeDrawer).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/customers');
    });
  });
});
