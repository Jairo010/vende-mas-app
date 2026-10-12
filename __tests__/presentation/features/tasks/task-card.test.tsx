import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TaskCard } from '@/presentation/features/tasks/task-card';
import { TaskEntity } from '@/core/entities/task.entity';

describe('TaskCard', () => {
  const mockTask = new TaskEntity({
    id: 'task-test-1',
    title: 'Visitar cliente El Trébol',
    description: 'Presentación catálogo nuevo',
    category: 'SALE',
    status: 'PENDING',
    dueDate: '2026-10-15T10:00:00Z',
    userId: 'usr-1',
    customerId: 'cust-1',
    customer: {
      id: 'cust-1',
      name: 'Comercial El Trébol',
      phone: '0987654321',
    },
  });

  it('should render task title, customer name, and category', async () => {
    const onPress = jest.fn();
    const onToggleStatus = jest.fn();

    const { getByText } = await render(
      <TaskCard
        task={mockTask}
        onPress={onPress}
        onToggleStatus={onToggleStatus}
      />,
    );

    expect(getByText('Visitar cliente El Trébol')).toBeTruthy();
    expect(getByText('Comercial El Trébol')).toBeTruthy();
    expect(getByText('Venta')).toBeTruthy();
  });

  it('should trigger onToggleStatus when checkbox is pressed', async () => {
    const onPress = jest.fn();
    const onToggleStatus = jest.fn();

    const { getByTestId } = await render(
      <TaskCard
        task={mockTask}
        onPress={onPress}
        onToggleStatus={onToggleStatus}
      />,
    );

    const checkbox = getByTestId('task-checkbox-task-test-1');
    fireEvent.press(checkbox);

    await waitFor(() => {
      expect(onToggleStatus).toHaveBeenCalledWith('task-test-1', 'PENDING');
    });
  });

  it('should trigger onPress when the card is pressed', async () => {
    const onPress = jest.fn();
    const onToggleStatus = jest.fn();

    const { getByTestId } = await render(
      <TaskCard
        task={mockTask}
        onPress={onPress}
        onToggleStatus={onToggleStatus}
      />,
    );

    const card = getByTestId('task-card-task-test-1');
    fireEvent.press(card);

    await waitFor(() => {
      expect(onPress).toHaveBeenCalledWith(mockTask);
    });
  });
});
