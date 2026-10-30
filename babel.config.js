module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
    plugins: [
      // Resolves the "@/..." import alias used throughout the app (mirrors
      // tsconfig.json's "paths", which Metro does not read on its own).
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        },
      ],
      // Must be listed last.
      'react-native-worklets/plugin',
    ],
  };
};
