import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TaskFormSheet } from '@/presentation/features/tasks/task-form-sheet';

describe('TaskFormSheet', () => {
  it('should render form fields when visible and trigger onClose on close button press', async () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();

    const { getByTestId, getByText } = await render(
      <TaskFormSheet visible={true} onClose={onClose} onSubmit={onSubmit} />,
    );

    expect(getByTestId('task-title-input')).toBeTruthy();
    expect(getByText('Nueva Tarea')).toBeTruthy();

    const closeBtn = getByTestId('task-form-close-button');
    fireEvent.press(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('should submit valid form data when fields are filled', async () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();

    const { getByTestId } = await render(
      <TaskFormSheet visible={true} onClose={onClose} onSubmit={onSubmit} />,
    );

    fireEvent.changeText(
      getByTestId('task-title-input'),
      'Llamada de seguimiento',
    );

    const categoryBtn = getByTestId('form-category-GENERAL');
    fireEvent.press(categoryBtn);

    const submitBtn = getByTestId('task-form-submit-button');
    fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Llamada de seguimiento',
          category: 'GENERAL',
        }),
      );
    });
  });
});
