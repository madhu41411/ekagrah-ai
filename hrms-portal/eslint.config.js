const js = require('@eslint/js');
const ts = require('typescript-eslint');

module.exports = [
  {
    ignores: [
      'node_modules',
      '.next',
      'dist',
      'build',
      '.prisma',
      'prisma/generated',
      'next-env.d.ts',
      'postcss.config.js',
      'prettier.config.js',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
