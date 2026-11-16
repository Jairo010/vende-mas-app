import { fireEvent, render, screen } from '@testing-library/react-native';
import { AgendaCalendar } from '@/presentation/features/agenda/agenda-calendar';
import type { CalendarMarks } from '@/presentation/features/agenda/agenda-marks';

const TODAY = '2026-11-16'; // Monday
const MARKS: CalendarMarks = { '2026-11-18': { dots: [{ key: 'ORDER', color: 'blue' }] } };

async function renderCalendar(selectedDate = TODAY) {
  const onDateChange = jest.fn();
  await render(
    <AgendaCalendar
      selectedDate={selectedDate}
      today={TODAY}
      onDateChange={onDateChange}
      marks={MARKS}
    />,
  );
  return onDateChange;
}

describe('AgendaCalendar', () => {
  it('shows the week of the selected day, from Monday', async () => {
    await renderCalendar();

    expect(screen.getByText('Noviembre 2026')).toBeTruthy();
    expect(screen.getByTestId('agenda-day-2026-11-16')).toHaveAccessibilityState({
      selected: true,
    });
    expect(screen.getByTestId('agenda-day-2026-11-22')).toBeTruthy();
    expect(screen.queryByTestId('agenda-day-2026-11-23')).toBeNull();
  });

  it('selects the day that is pressed', async () => {
    const onDateChange = await renderCalendar();

    await fireEvent.press(screen.getByTestId('agenda-day-2026-11-18'));
    await fireEvent.press(screen.getByTestId('agenda-day-2026-11-16'));

    expect(onDateChange).toHaveBeenCalledTimes(1);
    expect(onDateChange).toHaveBeenCalledWith('2026-11-18');
  });

  it('moves a week at a time while it shows a week', async () => {
    const onDateChange = await renderCalendar();

    await fireEvent.press(screen.getByTestId('agenda-calendar-next'));
    await fireEvent.press(screen.getByTestId('agenda-calendar-previous'));

    expect(onDateChange).toHaveBeenNthCalledWith(1, '2026-11-23');
    expect(onDateChange).toHaveBeenNthCalledWith(2, '2026-11-09');
  });

  it('opens into the month and then moves a month at a time', async () => {
    const onDateChange = await renderCalendar();

    await fireEvent.press(screen.getByTestId('agenda-calendar-title'));

    expect(screen.getByTestId('agenda-day-2026-11-01')).toBeTruthy();
    expect(screen.getByTestId('agenda-day-2026-11-30')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('agenda-calendar-next'));
    expect(onDateChange).toHaveBeenCalledWith('2026-12-16');

    await fireEvent.press(screen.getByTestId('agenda-calendar-toggle'));
    expect(screen.queryByTestId('agenda-day-2026-11-30')).toBeNull();
  });
});
