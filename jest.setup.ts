import '@testing-library/jest-native/extend-expect';

// Mock react-native-worklets
jest.mock('react-native-worklets', () => ({}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native');

  const mockAnimationBuilder = {
    duration: () => mockAnimationBuilder,
    delay: () => mockAnimationBuilder,
    springify: () => mockAnimationBuilder,
    damping: () => mockAnimationBuilder,
  };

  return {
    __esModule: true,
    default: {
      View,
      Text,
      createAnimatedComponent: (component: unknown) => component,
    },
    useSharedValue: (init: unknown) => ({ value: init }),
    useAnimatedStyle: (fn: () => Record<string, unknown>) => fn() || {},
    withTiming: (toValue: unknown) => toValue,
    withSpring: (toValue: unknown) => toValue,
    withDelay: (_delay: number, toValue: unknown) => toValue,
    FadeInDown: mockAnimationBuilder,
    FadeInUp: mockAnimationBuilder,
    FadeOutUp: mockAnimationBuilder,
  };
});

// Mock safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
}));

// Mock expo-secure-store
const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStore.delete(key);
  }),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => ['(auth)'],
  Link: 'Link',
}));
