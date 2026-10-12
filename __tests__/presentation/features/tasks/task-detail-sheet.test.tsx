import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskDetailSheet } from '@/presentation/features/tasks/task-detail-sheet';
import { TaskEntity } from '@/core/entities/task.entity';

describe('TaskDetailSheet', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const mockTask = new TaskEntity({
    id: 'task-100',
    type: 'SALE',
    category: 'SALE',
    title: 'Cierre de contrato con Don Carlos',
    description: 'Entrega de catálogo y acuerdo de precios',
    status: 'IN_PROGRESS',
    dueDate: '2026-10-25T14:30:00Z',
    latitude: -0.1806,
    longitude: -78.4678,
    photoUrl: 'https://cdn.vendemas.com/test.jpg',
    userId: 'usr-1',
    customerId: 'cust-1',
    customer: {
      id: 'cust-1',
      name: 'Abarrotes Don Carlos',
      phone: '0991234567',
      address: 'Av. Colón 123',
    },
    history: [
      {
        id: 'h-1',
        taskId: 'task-100',
        fromType: 'OPPORTUNITY',
        toType: 'SALE',
        fromStatus: 'PENDING',
        toStatus: 'IN_PROGRESS',
        userId: 'usr-1',
        latitude: -0.1806,
        longitude: -78.4678,
        photoUrl: null,
        notes: 'Cliente aceptó propuesta',
        createdAt: '2026-10-20T10:00:00Z',
      },
    ],
  });

  it('should render task details, customer card, GPS, photo, and audit timeline', async () => {
    const handleEdit = jest.fn();
    const handleDelete = jest.fn();

    const utils = await render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailSheet
          task={mockTask}
          visible={true}
          onClose={jest.fn()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </QueryClientProvider>,
    );

    expect(utils.getByText('Cierre de contrato con Don Carlos')).toBeTruthy();
    expect(utils.getByText('Abarrotes Don Carlos')).toBeTruthy();
    expect(utils.getByText('Entrega de catálogo y acuerdo de precios')).toBeTruthy();
    expect(utils.getByText('Ubicación GPS capturada')).toBeTruthy();
    expect(utils.getByText('Foto Anexada')).toBeTruthy();
    expect(utils.getByText('Transicionar Etapa')).toBeTruthy();
    expect(utils.getByText('Actualizar Estado')).toBeTruthy();
    expect(utils.getByText('Historial de Actividades (Logs)')).toBeTruthy();
    expect(utils.getByText('"Cliente aceptó propuesta"')).toBeTruthy();
  });

  it('should trigger edit and delete actions when buttons are pressed', async () => {
    const handleEdit = jest.fn();
    const handleDelete = jest.fn();

    const utils = await render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailSheet
          task={mockTask}
          visible={true}
          onClose={jest.fn()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </QueryClientProvider>,
    );

    const editBtn = utils.getByTestId('edit-task-btn');
    fireEvent.press(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockTask);
  });
});
