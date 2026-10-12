import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import {
  DatePickerModal,
  TimePickerModal,
  DatePickerField,
  TimePickerField,
  formatDisplayDate,
  formatDisplayTime,
} from '@/presentation/components/ui';

describe('Date & Time Pickers', () => {
  afterEach(() => {
    cleanup();
  });
  describe('formatDisplayDate & formatDisplayTime helpers', () => {
    it('formats ISO date to Spanish human-readable string', () => {
      const result = formatDisplayDate('2026-09-17');
      expect(result).toBe('17 de Sep, 2026');
    });

    it('formats 24h time to 12h AM/PM string', () => {
      expect(formatDisplayTime('14:30')).toBe('02:30 PM');
      expect(formatDisplayTime('09:00')).toBe('09:00 AM');
      expect(formatDisplayTime('00:00')).toBe('12:00 AM');
      expect(formatDisplayTime('12:00')).toBe('12:00 PM');
    });
  });

  describe('DatePickerModal', () => {
    it('renders and confirms selected date', async () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();

      const utils = await render(
        <DatePickerModal
          visible={true}
          initialDate="2026-09-17"
          onConfirm={onConfirm}
          onClose={onClose}
        />,
      );

      expect(utils.getByText('Septiembre 2026')).toBeTruthy();
      utils.debug();

      // Tap Confirm button
      const confirmBtn = utils.getByTestId('confirm-date-btn');
      fireEvent.press(confirmBtn);

      expect(onConfirm).toHaveBeenCalledWith('2026-09-17');
      expect(onClose).toHaveBeenCalled();
    });

    it('changes date on preset selection', async () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();

      const utils = await render(
        <DatePickerModal
          visible={true}
          initialDate="2026-01-01"
          onConfirm={onConfirm}
          onClose={onClose}
        />,
      );

      // Select "Hoy" preset
      const todayBtn = utils.getByTestId('date-preset-today');
      fireEvent.press(todayBtn);

      const now = new Date();
      const expectedIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      await waitFor(() => {
        expect(utils.getByTestId(`date-day-${expectedIso}`)).toBeTruthy();
      });

      const confirmBtn = utils.getByTestId('confirm-date-btn');
      fireEvent.press(confirmBtn);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith(expectedIso);
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('TimePickerModal', () => {
    it('renders and confirms selected time', async () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();

      const utils = await render(
        <TimePickerModal
          visible={true}
          initialTime="10:00"
          onConfirm={onConfirm}
          onClose={onClose}
        />,
      );

      expect(utils.getByText('Seleccionar Hora')).toBeTruthy();

      // Change hour to 4
      const hour4Btn = utils.getByTestId('hour-btn-4');
      fireEvent.press(hour4Btn);

      await waitFor(() => {
        expect(utils.getByText('04 : 00')).toBeTruthy();
      });

      const confirmBtn = utils.getByTestId('confirm-time-btn');
      fireEvent.press(confirmBtn);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith('04:00');
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('DatePickerField & TimePickerField', () => {
    it('opens DatePickerModal when field is pressed', async () => {
      const onChange = jest.fn();
      const utils = await render(
        <DatePickerField
          label="Fecha de Visita"
          value="2026-09-17"
          onChange={onChange}
          testID="custom-date-field"
        />,
      );

      expect(utils.getByText('17 de Sep, 2026')).toBeTruthy();

      const field = utils.getByTestId('custom-date-field');
      fireEvent.press(field);

      // Modal should appear with Month header
      await waitFor(() => {
        expect(utils.getByText('Septiembre 2026')).toBeTruthy();
      });
    });

    it('opens TimePickerModal when time field is pressed', async () => {
      const onChange = jest.fn();
      const utils = await render(
        <TimePickerField
          label="Hora programada"
          value="10:30"
          onChange={onChange}
          testID="custom-time-field"
        />,
      );

      expect(utils.getByText('10:30 AM')).toBeTruthy();

      const field = utils.getByTestId('custom-time-field');
      fireEvent.press(field);

      await waitFor(() => {
        expect(utils.getByText('Horarios Frecuentes')).toBeTruthy();
      });
    });
  });
});
