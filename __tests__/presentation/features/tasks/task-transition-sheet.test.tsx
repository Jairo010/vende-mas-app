import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskTransitionSheet } from '@/presentation/features/tasks/task-transition-sheet';
import { TaskEntity } from '@/core/entities/task.entity';

describe('TaskTransitionSheet', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
  });

  it('should display customer warning when transitioning to SALE without customer', async () => {
    const oppTaskNoCustomer = new TaskEntity({
      id: 'opp-1',
      type: 'OPPORTUNITY',
      title: 'Prospecto nuevo sin cliente',
      userId: 'usr-1',
    });

    const utils = await render(
      <QueryClientProvider client={queryClient}>
        <TaskTransitionSheet
          task={oppTaskNoCustomer}
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      </QueryClientProvider>,
    );

    // Switch target to SALE
    const saleTypeBtn = utils.getByTestId('target-type-sale');
    fireEvent.press(saleTypeBtn);

    // Should display customer required notice
    await waitFor(() => {
      expect(
        utils.getByText(
          'Para registrar o pasar a Venta es obligatorio asignar un cliente existente o registrar uno nuevo.',
        ),
      ).toBeTruthy();
      expect(utils.getByTestId('transition-select-customer-btn')).toBeTruthy();
    });
  });
});
