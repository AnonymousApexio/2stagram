import { defineConfig, devices } from '@playwright/test';

// Three critical journeys: registration, publication, reporting.
// Messaging remains covered by manual testing.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  use: { baseURL: 'http://localhost:8080', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
