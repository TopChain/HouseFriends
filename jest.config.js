const expoPreset = require('jest-expo/jest-preset');

module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/ui/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFiles: ['<rootDir>/tests/jest.setup.js'],
  clearMocks: true,
  transform: {
    ...expoPreset.transform,
    '\\.mjs$': expoPreset.transform['\\.[jt]sx?$'],
  },
};
