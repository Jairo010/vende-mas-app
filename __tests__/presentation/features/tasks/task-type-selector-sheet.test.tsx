import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TaskTypeSelectorSheet } from '@/presentation/features/tasks/task-type-selector-sheet';

describe('TaskTypeSelectorSheet', () => {
  it('should render the 4 interactive type cards and allow selection', async () => {
    const handleSelectType = jest.fn();
    const handleClose = jest.fn();

    const utils = await render(
      <TaskTypeSelectorSheet
        visible={true}
        onClose={handleClose}
        onSelectType={handleSelectType}
      />,
    );

    expect(utils.getByText('¿Qué tipo de tarea deseas crear?')).toBeTruthy();
    expect(utils.getByText('Oportunidad Comercial')).toBeTruthy();
    expect(utils.getByText('Visita Agendada')).toBeTruthy();
    expect(utils.getByText('Venta Directa')).toBeTruthy();
    expect(utils.getByText('Cobranza')).toBeTruthy();

    const oppBtn = utils.getByTestId('select-type-opportunity');
    fireEvent.press(oppBtn);
    await waitFor(() => expect(handleSelectType).toHaveBeenCalledWith('OPPORTUNITY'));

    const saleBtn = utils.getByTestId('select-type-sale');
    fireEvent.press(saleBtn);
    await waitFor(() => expect(handleSelectType).toHaveBeenCalledWith('SALE'));
  });

  it('should trigger onClose when close button is pressed', async () => {
    const handleClose = jest.fn();

    const utils = await render(
      <TaskTypeSelectorSheet
        visible={true}
        onClose={handleClose}
        onSelectType={jest.fn()}
      />,
    );

    const closeBtn = utils.getByTestId('close-type-selector-btn');
    fireEvent.press(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
