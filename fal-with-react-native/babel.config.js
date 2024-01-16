module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '~': './src',
        },
      },
    ],
    ['nativewind/babel', { compileOnly: true }],
    'react-native-reanimated/plugin',
  ],
};
