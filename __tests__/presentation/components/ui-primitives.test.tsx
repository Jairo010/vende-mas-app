import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SegmentedControl } from '@/presentation/components/ui/segmented-control';
import { Stepper } from '@/presentation/components/ui/stepper';
import { Chip } from '@/presentation/components/ui/chip';
import { initialsOf } from '@/presentation/components/ui/avatar';
import { ErrorBoundary } from '@/presentation/components/feedback/error-boundary';
import { es } from '@/shared/i18n/es';

describe('UI primitives', () => {
  it('SegmentedControl reports the selected option', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        options={[
          { value: 'light', label: 'Claro' },
          { value: 'dark', label: 'Oscuro' },
        ]}
        value="light"
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByTestId('segment-dark'));
    await fireEvent.press(screen.getByTestId('segment-light'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('Stepper respects its bounds', async () => {
    const onChange = jest.fn();
    await render(<Stepper value={1} min={1} max={2} onChange={onChange} />);

    await fireEvent.press(screen.getByTestId('stepper-decrease'));
    await fireEvent.press(screen.getByTestId('stepper-increase'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('Chip exposes its selected state', async () => {
    await render(<Chip testID="chip" label="Aceites" selected />);
    expect(screen.getByTestId('chip').props.accessibilityState).toEqual({ selected: true });
  });

  it('Avatar initials use the first two words', () => {
    expect(initialsOf('Lubricadora El Pana')).toBe('LE');
    expect(initialsOf('taller')).toBe('T');
    expect(initialsOf('  ')).toBe('?');
  });

  it('ErrorBoundary shows a recoverable fallback instead of crashing', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    function Fragile() {
      if (shouldThrow) throw new Error('boom');
      return <Text>Contenido</Text>;
    }

    await render(
      <ErrorBoundary>
        <Fragile />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary-fallback')).toBeTruthy();

    shouldThrow = false;
    await fireEvent.press(screen.getByText(es.common.retry));
    expect(screen.getByText('Contenido')).toBeTruthy();
    consoleError.mockRestore();
  });
});
