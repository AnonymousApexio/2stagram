import { defineConfig, devices } from '@playwright/test';

// Trois parcours critiques : inscription, publication, signalement.
// La messagerie reste testée manuellement.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  use: { baseURL: 'http://localhost:8080', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
