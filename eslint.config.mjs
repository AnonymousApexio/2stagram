import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import security from 'eslint-plugin-security';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'coverage/**',
      '.nyc_output/**',
      'db/**',
      'media/**',
      'data/**',
      'uploads/**',
      'docs/api/generated/**',
      'docs-site/.docusaurus/**',
      'docs-site/static/reference/**',
      'playwright-report/**',
      'test-results/**',
      '.husky/_/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          caughtErrors: 'all',
        },
      ],
    },
  },
  {
    files: ['{backend,frontend,shared}/src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: null,
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Utiliser un export nommé dans le code applicatif.',
        },
        {
          selector: "ExportSpecifier[exported.name='default']",
          message: 'Utiliser un export nommé dans le code applicatif.',
        },
        {
          selector: "JSXAttribute[name.name='style']",
          message: 'Utiliser un CSS Module et les variables de la charte.',
        },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'Afficher les données externes comme du texte, sans HTML brut.',
        },
        {
          selector:
            "JSXOpeningElement[name.name=/^(div|span)$/] > JSXAttribute[name.name='onClick']",
          message: 'Utiliser un bouton ou un lien sémantique.',
        },
      ],
    },
  },
  {
    files: ['{backend,frontend,shared}/src/**/*.{js,jsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message: 'Les sources doivent être en TypeScript.',
        },
      ],
    },
  },
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    ignores: ['frontend/src/services/**', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'Placer les appels HTTP dans services/, appelés via TanStack Query.',
        },
        { name: 'XMLHttpRequest', message: 'Utiliser la couche de services.' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'fetch',
          message: 'Utiliser les services.',
        },
        {
          object: 'globalThis',
          property: 'fetch',
          message: 'Utiliser les services.',
        },
      ],
    },
  },
  {
    files: ['shared/src/schemas/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'node:*',
                'express',
                'better-sqlite3',
                'drizzle-orm',
                'drizzle-orm/*',
              ],
              message:
                'Les schémas partagés doivent rester utilisables dans le navigateur.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['{backend,frontend,shared}/src/**/*.{ts,tsx}'],
    plugins: { security },
    rules: security.configs.recommended.rules,
  },
];
