import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    projects: [
      {
        test: {
          name: 'backend',
          environment: 'node',
          include: ['backend/{src,tests/integration}/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'shared',
          environment: 'node',
          include: ['shared/src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'frontend',
          environment: 'jsdom',
          include: ['frontend/src/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'tooling',
          environment: 'node',
          include: ['scripts/**/*.test.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: [
        '{backend,frontend,shared}/src/**/*.{ts,tsx}',
        'scripts/docs-audit-policy.ts',
        'scripts/audit-docs.ts',
      ],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts'],
      thresholds: { lines: 70, branches: 70, perFile: true },
    },
  },
});
