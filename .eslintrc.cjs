const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  env: {
    es2023: true,
    node: true,
  },
  plugins: ['prettier'],
  extends: [
    'standard',
    'prettier',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    semi: 'off',
    'arrow-parens': ['error', 'always'],
    'comma-dangle': 'off',
    'n/no-callback-literal': 'off',
    'space-before-function-paren': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
    '@typescript-eslint/space-before-function-paren': [
      'error',
      {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
  },
});
