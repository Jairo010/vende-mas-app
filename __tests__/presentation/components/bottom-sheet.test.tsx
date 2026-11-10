import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BottomSheet } from '@/presentation/components/ui/bottom-sheet';

/*
 * The library's real modal, provider and portal, not the global mock: the mock always renders its
 * children, so it can never show a sheet that fails to open. Only what draws and animates is
 * replaced; the fake sheet closes through the same `onClose` the real one calls when swiped down.
 */
let swipeDown: (() => void) | null = null;

jest.mock('react-native-reanimated', () => {
  const easing = () => () => 0;
  return {
    __esModule: true,
    default: {
      View: jest.requireActual('react-native').View,
      createAnimatedComponent: (component: unknown) => component,
    },
    Easing: { out: easing, exp: easing, bezier: easing },
    useSharedValue: (value: unknown) => ({ value, get: () => value, set: () => undefined }),
  };
});

jest.mock('@gorhom/bottom-sheet/lib/commonjs/components/bottomSheetHostingContainer', () => {
  const { View } = jest.requireActual('react-native');
  return { BottomSheetHostingContainer: View };
});

jest.mock('@gorhom/bottom-sheet/lib/commonjs/components/bottomSheet', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const FakeSheet = forwardRef(
    (props: { onClose: () => void; children: React.ReactNode }, ref: React.Ref<unknown>) => {
      swipeDown = props.onClose;
      useImperativeHandle(ref, () => ({
        forceClose: () => props.onClose(),
        close: () => props.onClose(),
        snapToIndex: () => undefined,
      }));
      return <View>{props.children}</View>;
    },
  );
  FakeSheet.displayName = 'FakeSheet';
  return { __esModule: true, default: FakeSheet };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = jest.requireActual('react-native');
  return {
    BottomSheetModal: jest.requireActual(
      '@gorhom/bottom-sheet/lib/commonjs/components/bottomSheetModal/BottomSheetModal',
    ).default,
    BottomSheetModalProvider: jest.requireActual(
      '@gorhom/bottom-sheet/lib/commonjs/components/bottomSheetModalProvider/BottomSheetModalProvider',
    ).default,
    BottomSheetBackdrop: View,
    BottomSheetView: View,
  };
});

function Screen() {
  const [open, setOpen] = useState(false);
  return (
    <BottomSheetModalProvider>
      <Pressable testID="open" onPress={() => setOpen(true)} />
      <Pressable testID="close" onPress={() => setOpen(false)} />
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <Text>Contenido</Text>
      </BottomSheet>
    </BottomSheetModalProvider>
  );
}

const nextFrames = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

const press = async (testID: string) => {
  await fireEvent.press(screen.getByTestId(testID));
  await nextFrames();
};

describe('BottomSheet', () => {
  beforeEach(async () => {
    await render(<Screen />);
    await nextFrames();
  });

  it('stays hidden until it is opened', () => {
    expect(screen.queryByText('Contenido')).toBeNull();
  });

  it('shows its content the first time it opens', async () => {
    await press('open');

    expect(screen.getByText('Contenido')).toBeTruthy();
  });

  it('opens again after being closed from the screen', async () => {
    await press('open');
    await press('close');
    expect(screen.queryByText('Contenido')).toBeNull();

    await press('open');

    expect(screen.getByText('Contenido')).toBeTruthy();
  });

  it('opens again after the seller swipes it down', async () => {
    await press('open');
    await act(async () => swipeDown?.());
    await nextFrames();
    expect(screen.queryByText('Contenido')).toBeNull();

    await press('open');

    expect(screen.getByText('Contenido')).toBeTruthy();
  });
});
