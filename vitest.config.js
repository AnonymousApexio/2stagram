import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 'node' par défaut ; les tests de composants React déclarent
    // leur propre environnement via un commentaire en tête de fichier :
    // @vitest-environment jsdom
    environment: 'node',
    globals: true,
    include: ['**/tests/**/*.test.{js,jsx}', '**/src/**/*.test.{js,jsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['backend/src/**/*.js', 'frontend/src/**/*.{js,jsx}'],
      exclude: ['**/*.test.{js,jsx}', '**/node_modules/**'],
    },
  },
});
