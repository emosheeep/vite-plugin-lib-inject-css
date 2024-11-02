import antfu from '@antfu/eslint-config';

export default antfu({
  type: 'lib',
  ignores: ['**/{README,CHANGELOG}.md'],
  stylistic: {
    semi: true,
  },
  rules: {
    'no-console': 'off',
    'style/arrow-parens': ['error', 'always'],
    'style/comma-dangle': 'off',
    'node/no-callback-literal': 'off',
    'ts/no-var-requires': 'off',
    'ts/explicit-function-return-type': 'off',
    'ts/no-explicit-any': 'off',
    'ts/ban-ts-comment': 'off',
    'ts/no-non-null-assertion': 'off',
    'style/space-before-function-paren': [
      'error',
      {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
  },
});
