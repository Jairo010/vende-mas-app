module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      // Bundles Drizzle's .sql migrations as strings (src/infrastructure/database/migrations)
      ['inline-import', { extensions: ['.sql'] }],
      'react-native-reanimated/plugin',
    ],
  };
};
