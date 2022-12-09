const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'standard',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    semi: 'off',
    indent: 'off',
    'comma-dangle': 'off',
    'operator-linebreak': 'off',
    'n/no-callback-literal': 'off',
    'no-unused-expressions': 'off',
    'space-before-function-paren': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
    '@typescript-eslint/space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always',
    }],
  },
});
