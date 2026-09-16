interface EnvironmentConfig {
  API_BASE_URL: string;
  IS_DEVELOPMENT: boolean;
}

export const ENV: EnvironmentConfig = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  IS_DEVELOPMENT: __DEV__,
};
