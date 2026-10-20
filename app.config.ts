import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json with values that must not live in the repository (read from `.env` or EAS
 * environment variables when the native app is built).
 *
 * GOOGLE_MAPS_ANDROID_API_KEY: Maps SDK for Android key (restricted to the package name and
 * SHA-1). Without it the react-native-maps plugin leaves the key out of the manifest and the
 * Android map would crash, so `extra.googleMapsAndroidKeyConfigured` lets the app skip the map.
 * iPhone uses Apple Maps (no key).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim() ?? '';

  return {
    ...config,
    name: config.name ?? 'vende-mas-app',
    slug: config.slug ?? 'vende-mas-app',
    plugins: [
      ...(config.plugins ?? []),
      ['react-native-maps', { androidGoogleMapsApiKey: androidMapsKey || undefined }],
    ],
    extra: {
      ...config.extra,
      googleMapsAndroidKeyConfigured: androidMapsKey.length > 0,
    },
  };
};
