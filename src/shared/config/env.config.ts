import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

interface EnvironmentConfig {
  API_BASE_URL: string;
  IS_DEVELOPMENT: boolean;
  /**
   * The in-app map can be shown: always on iPhone (Apple Maps) and in Expo Go (it ships its
   * own key); on an Android build only if GOOGLE_MAPS_ANDROID_API_KEY was set (app.config.ts).
   */
  MAPS_AVAILABLE: boolean;
}

const extra = Constants.expoConfig?.extra as
  { googleMapsAndroidKeyConfigured?: boolean } | undefined;

export const ENV: EnvironmentConfig = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  IS_DEVELOPMENT: __DEV__,
  MAPS_AVAILABLE:
    Platform.OS !== 'android' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    extra?.googleMapsAndroidKeyConfigured === true,
};
