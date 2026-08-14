const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  { ignores: ['dist*/**', 'coverage/**', 'neon/functions/**'] },
  expoConfig,
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'react-hooks/exhaustive-deps': 'error'
    }
  }
]);
