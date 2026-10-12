import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TasksCalendarStrip } from '@/presentation/features/tasks/tasks-calendar-strip';

describe('TasksCalendarStrip', () => {
  it('should render 7 days and allow selecting today or all', async () => {
    const onSelectDate = jest.fn();

    const { getByTestId, getByText } = await render(
      <TasksCalendarStrip
        selectedDate="2026-09-16"
        onSelectDate={onSelectDate}
        tasksCountByDate={{ '2026-09-16': 3 }}
      />,
    );

    expect(getByText('Hoy')).toBeTruthy();
    expect(getByText('Todas')).toBeTruthy();

    // Tap "Hoy" button
    const todayBtn = getByTestId('calendar-today-button');
    fireEvent.press(todayBtn);
    await waitFor(() => expect(onSelectDate).toHaveBeenCalled());

    // Tap "Todas" button
    const allBtn = getByTestId('calendar-all-button');
    fireEvent.press(allBtn);
    await waitFor(() => expect(onSelectDate).toHaveBeenCalledWith(null));
  });
});
